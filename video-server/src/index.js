import 'dotenv/config';
import { loadConfig } from './config.js';
import { createStorage, exists } from './storage.js';
import { createDb } from './db.js';
import { createProcessor, checkBinaries } from './processor.js';
import { createApp } from './app.js';

const config = loadConfig();

await checkBinaries(config);

const storage = createStorage(config.storageDir);
await storage.ensure();

const db = createDb(config);
const processor = createProcessor({ config, storage, db });
const app = createApp({ config, db, storage, processor });

// Server beech mein band ho gaya tha to jo videos "Processing" thi unhein dobara line mein lagao
for (const id of await db.listProcessingIds()) {
  if (await exists(storage.sourcePath(id))) {
    processor.enqueue(id);
  } else {
    await db
      .updateLecture(id, {
        processing_status: 'Failed',
        processing_error: 'The server restarted and the uploaded file was lost. Please upload the video again.',
      })
      .catch(() => {});
  }
}

app.listen(config.port, () => {
  console.log(`Video server chal raha hai: http://localhost:${config.port}`);
  console.log(`Videos yahan save hongi: ${config.storageDir}`);
});
