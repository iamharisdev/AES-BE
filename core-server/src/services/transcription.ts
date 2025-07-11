import OpenAI, { OpenAIError } from 'openai';
import fs from 'fs';
import os from 'os';
import path from 'path';

const openai = new OpenAI();

export const getTranscription = async ({ file, lang = 'en' }: { file: Buffer, lang?: string }) => {
  let tmpPath: string | undefined;
  try {
    // Write buffer to a temp file
    tmpPath = path.join(os.tmpdir(), `voice-note-${Date.now()}.m4a`);
    fs.writeFileSync(tmpPath, file);

    const result = await openai.audio.transcriptions.create({
      model: 'gpt-4o-transcribe',
      file: fs.createReadStream(tmpPath),
      language: lang,
      temperature: 0,
      response_format: 'text',
    });
    const text = typeof result === 'string' ? result.trim() : '';
    return { text };
  } catch (e) {
    if (e instanceof OpenAIError) {
      return { clientError: e.message };
    }
    throw e;
  } finally {
    if (tmpPath) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }
};
