import { experimental_generateImage as generateImage } from 'ai';
import { createAutomatic1111 } from 'automatic1111-provider';
import fs from 'fs';

export async function POST(req: Request) {  
    const body = await req.json() as { prompt: string };
    const { prompt } = body;
    const automatic1111 = createAutomatic1111({
        baseURL: 'http://127.0.0.1:7860',
      });
      
      const { image } = await generateImage({
        model: automatic1111.image('v1-5-pruned-emaonly'), // Default Automatic1111 model
        prompt: prompt,
        providerOptions: {
          automatic1111: {
            steps: 20,
            cfg_scale: 7,
            negative_prompt: 'blurry, low quality',
            sampler_name: "Euler a",
            denoising_strength: 0.5,
            check_model_exists: true,
          }
        }
      });
      const location = 'data/images/'+Date.now()+'.png';
      fs.writeFileSync(location, Buffer.from(image?.base64 ?? '', 'base64'));
      return Response.json(location);
}