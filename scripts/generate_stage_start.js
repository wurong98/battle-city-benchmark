// scripts/generate_stage_start.js
import fs from 'fs';
import path from 'path';

// 原版 FC 坦克大战最经典的开场：
// 噔 噔 噔 噔—— 噔！噔！噔！噔噔噔噔 噔————！
const sampleRate = 22050;

// 节拍定义 (单位秒)
const t16 = 0.082; // 十六分音符
const t8 = t16 * 2; // 八分音符
const t4 = t8 * 2;  // 四分音符

// 精确原版 Namco Battle City Stage Start 音轨
const notes = [
  // 1. 经典开头三连音 "噔 噔 噔"
  { freq: 392.00, dur: t16 }, // G4  噔
  { freq: 523.25, dur: t16 }, // C5  噔
  { freq: 659.25, dur: t16 }, // E5  噔
  { freq: 783.99, dur: t8 },  // G5  噔——
  { freq: 0,      dur: t16 }, // 停顿

  // 2. 经典中间转折重音
  { freq: 659.25, dur: t16 }, // E5
  { freq: 783.99, dur: t8 },  // G5
  { freq: 0,      dur: t16 },

  // 3. 升调进入高潮 "噔！噔！"
  { freq: 880.00, dur: t16 }, // A5
  { freq: 987.77, dur: t16 }, // B5
  { freq: 1046.50, dur: t8 }, // C6 噔！
  { freq: 0,      dur: t16 },

  // 4. 经典结尾快速下落琶音 "噔噔噔噔 噔————！"
  { freq: 1046.50, dur: t16 }, // C6
  { freq: 880.00,  dur: t16 }, // A5
  { freq: 783.99,  dur: t16 }, // G5
  { freq: 659.25,  dur: t16 }, // E5
  { freq: 523.25,  dur: t4 * 1.5 }, // C5 (长尾音落地 噔————！)
];

const totalDuration = notes.reduce((sum, n) => sum + n.dur, 0) + 0.2;
const numSamples = Math.floor(sampleRate * totalDuration);
const dataSize = numSamples * 2;

const buffer = Buffer.alloc(44 + dataSize);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);

// fmt subchunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);

// data subchunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

let currentSampleIdx = 0;

for (const note of notes) {
  const noteSamples = Math.floor(sampleRate * note.dur);
  const freq = note.freq;

  for (let i = 0; i < noteSamples && currentSampleIdx < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (freq > 0) {
      // NES 经典 25% 占空比方波脉冲 (FC 灵魂音色)
      const phase = (t * freq) % 1;
      const pulse = phase < 0.25 ? 1 : -1;

      // 短促跳音衰减
      const noteProgress = i / noteSamples;
      const envelope = Math.max(0, 1 - noteProgress * 0.4);
      sample = Math.floor(pulse * envelope * 14000);
    }

    buffer.writeInt16LE(sample, 44 + currentSampleIdx * 2);
    currentSampleIdx++;
  }
}

while (currentSampleIdx < numSamples) {
  buffer.writeInt16LE(0, 44 + currentSampleIdx * 2);
  currentSampleIdx++;
}

const outputPath = path.resolve('public/assets/audio/stage_start.wav');
fs.writeFileSync(outputPath, buffer);
console.log('Successfully generated authentic stage_start WAV at:', outputPath);
