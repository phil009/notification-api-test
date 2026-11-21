import * as shell from 'shelljs';
import * as path from 'path';
import * as fs from 'fs';

type Config = { [key: string]: string | boolean };

const stringify = (val: Config) => {
    return Object.keys(val)
        .map((key) => `${key}=${val[key]}`)
        .join(',');
};

export function generateAxiosSdk(dir: string, baseUrl: string) {
    const config: Config = {
        npmName: dir,
        snapshot: true,
        fileNaming: 'kebab-case',
        npmVersion: '1.0.0',
        useSingleRequestParameter: true,
        supportsES6: true,
    };

    const out = path.resolve(process.cwd(), 'src', 'sdk', dir);
    if (fs.existsSync(out)) {
        shell.rm('-rf', out);
    }
    shell.mkdir('-p', out);
    // shell.exec(`npx openapi-generator-cli generate -g typescript-axios -i ${baseUrl}/v3/api-docs -o ${out} --additional-properties ${stringify(config)}`);
    shell.exec(
        `docker run --rm -v ${out}:/out/ olaleye/openapi-generator-cli:5.1.1 generate -g typescript-axios -i ${baseUrl}/v3/api-docs -o /out --additional-properties ${stringify(
            config,
        )}`,
    );
}
