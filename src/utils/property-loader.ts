export class PropertyLoader {
    static parse(input: string): Record<string, string> {
        const environment: Record<string, string> = {};
        input?.split(/\n/).forEach((it) => {
            if (/^ *#/.test(it)) return;
            const pivot = it.indexOf('=');
            if (pivot < 0) return;
            environment[it.substring(0, pivot)] = it.substring(pivot + 1);
        });
        return environment;
    }
}
