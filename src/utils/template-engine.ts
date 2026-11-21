export abstract class TemplateEngine {
    abstract compile(templateName: string, data: unknown): Promise<string>;
}
