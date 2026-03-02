// Remotion video rendering service
// This runs the actual video generation pipeline

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { uploadVideo } from './storage';
import { supabaseAdmin } from './supabase';

const execAsync = promisify(exec);

export interface RenderOptions {
  videoId: string;
  scenes: any[];
  audioUrls: string[];
  compositionConfig: {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
  };
}

/**
 * Render video using Remotion
 */
export async function renderVideo(options: RenderOptions): Promise<string> {
  const { videoId, scenes, audioUrls, compositionConfig } = options;
  
  const workDir = path.join('/tmp', 'motion-renders', videoId);
  
  try {
    // 1. Create working directory
    await mkdir(workDir, { recursive: true });
    
    // 2. Generate Remotion project files
    await generateRemotionProject(workDir, scenes, compositionConfig);
    
    // 3. Download audio files
    await downloadAudioFiles(workDir, audioUrls);
    
    // 4. Render video with Remotion
    const outputPath = path.join(workDir, 'out', 'video.mp4');
    await runRemotionRender(workDir, outputPath, compositionConfig);
    
    // 5. Read rendered video
    const videoBuffer = await readFile(outputPath);
    
    // 6. Upload to Supabase
    const { url } = await uploadVideo(videoBuffer, videoId);
    
    // 7. Cleanup
    await rm(workDir, { recursive: true, force: true });
    
    return url;
    
  } catch (error) {
    console.error('Render error:', error);
    throw error;
  }
}

async function generateRemotionProject(
  workDir: string,
  scenes: any[],
  config: any
) {
  // Create package.json
  const packageJson = {
    name: 'motion-render',
    version: '1.0.0',
    dependencies: {
      remotion: '^4.0.0',
      '@remotion/cli': '^4.0.0',
      react: '^18.0.0',
      'react-dom': '^18.0.0',
    },
  };
  
  await writeFile(
    path.join(workDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      strict: true,
      jsx: 'react-jsx',
      esModuleInterop: true,
    },
  };
  
  await writeFile(
    path.join(workDir, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  // Create src directory
  const srcDir = path.join(workDir, 'src');
  await mkdir(srcDir, { recursive: true });

  // Generate scene components
  for (const scene of scenes) {
    await writeFile(
      path.join(srcDir, `${scene.section_name}.tsx`),
      scene.component_code
    );
  }

  // Generate Root.tsx
  const rootComponent = generateRootComponent(scenes, config);
  await writeFile(path.join(srcDir, 'Root.tsx'), rootComponent);

  // Generate entry point
  const entryPoint = `import { registerRoot } from 'remotion';
import { Root } from './Root';
registerRoot(Root);`;
  await writeFile(path.join(srcDir, 'index.tsx'), entryPoint);
}

function generateRootComponent(scenes: any[], config: any): string {
  const imports = scenes
    .map(s => `import { ${s.section_name}Scene } from './${s.section_name}';`)
    .join('\n');

  const sequences = scenes
    .map((s, i) => {
      const from = scenes.slice(0, i).reduce((acc, scene) => acc + scene.duration, 0);
      return `<Sequence from={${from}} durationInFrames={${s.duration}}>
      <${s.section_name}Scene />
    </Sequence>`;
    })
    .join('\n    ');

  return `import { Composition, Sequence } from 'remotion';
${imports}

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="MotionVideo"
        component={Video}
        durationInFrames={${config.durationInFrames}}
        fps={${config.fps}}
        width={${config.width}}
        height={${config.height}}
      />
    </>
  );
};

const Video: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0a0a0a' }}>
      ${sequences}
    </div>
  );
};
`;
}

async function downloadAudioFiles(workDir: string, audioUrls: string[]) {
  // Download each audio file
  for (let i = 0; i < audioUrls.length; i++) {
    const response = await fetch(audioUrls[i]);
    const buffer = await response.arrayBuffer();
    await writeFile(
      path.join(workDir, 'src', `audio-${i}.mp3`),
      Buffer.from(buffer)
    );
  }
}

async function runRemotionRender(
  workDir: string,
  outputPath: string,
  config: any
) {
  // Install dependencies
  await execAsync('npm install', { cwd: workDir });
  
  // Create output directory
  await mkdir(path.join(workDir, 'out'), { recursive: true });
  
  // Render
  const renderCommand = `npx remotion render src/index.tsx MotionVideo out/video.mp4 --props='${JSON.stringify({})}'`;
  
  await execAsync(renderCommand, {
    cwd: workDir,
    env: {
      ...process.env,
      REMOTION_AWS_ACCESS_KEY_ID: process.env.REMOTION_AWS_ACCESS_KEY_ID,
      REMOTION_AWS_SECRET_ACCESS_KEY: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
    },
  });
}

async function readFile(filePath: string): Promise<Buffer> {
  const { readFile } = await import('fs/promises');
  return readFile(filePath);
}
