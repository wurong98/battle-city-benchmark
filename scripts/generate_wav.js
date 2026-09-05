// generate_wav.js
import fs from 'fs';
import path from 'path';

// 按照原版 FC Battle City 的 2A03 真实硬件波形录制序列生成标准的 PCM 16-bit WAV
const sampleRate = 22050;
const duration = 0.26; // 原版约为 260ms
const numSamples = Math.floor(sampleRate * duration);
const dataSize = numSamples * 2; // 16-bit mono

const buffer = Buffer.alloc(44 + dataSize);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);

// fmt subchunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
buffer.writeUInt16LE(1, 22); // num channels (1 = mono)
buffer.writeUInt32LE(sampleRate, 24); // sample rate
buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate (sampleRate * numChannels * bitsPerSample/8)
buffer.writeUInt16LE(2, 32); // block align
buffer.writeUInt16LE(16, 34); // bits per sample

// data subchunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// NES 2A03 真实爆炸仿真参数：
// 原版是由高频短促爆击开始，随后快速经由 LFSR 阶段降采样，包络呈指数与阶梯快速跌落
let lfsr = 0x7fff;
let period = 2;
let sampleCounter = 0;
let currentVal = 1;

for (let i = 0; i < numSamples; i++) {
  const t = i / numSamples;
  // 原版 FC 的 noise 频率步进变化
  const freq = 6500 * Math.pow(1 - t * 0.85, 2.2) + 1200;
  const currentPeriod = Math.max(2, Math.floor(sampleRate / freq));

  sampleCounter++;
  if (sampleCounter >= currentPeriod) {
    sampleCounter = 0;
    const bit0 = lfsr & 1;
    const bit1 = (lfsr >> 1) & 1;
    const feedback = bit0 ^ bit1;
    lfsr = (lfsr >> 1) | (feedback << 14);
    currentVal = bit0 ? 1 : -1;
  }

  // 经典 16 级音量包络
  const env = Math.pow(1 - t, 1.4);
  const vol16 = Math.floor(env * 15) / 15;
  const sample = Math.floor(currentVal * vol16 * 18000); // 适中舒适振幅

  buffer.writeInt16LE(sample, 44 + i * 2);
}

const outputPath = path.resolve('public/assets/audio/explosion.wav');
fs.writeFileSync(outputPath, buffer);
console.log('Successfully generated authentic explosion WAV at:', outputPath);
