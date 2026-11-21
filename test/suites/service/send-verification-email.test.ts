import { HbsTemplateEngine } from '../../../src/utils/template-engine-impl';

describe('send verification email', () => {
    it('should return a string after successful compile', async () => {
        const templateEngine = new HbsTemplateEngine();
        const verificationCode = '234532';
        const displayName = 'Emmanuel';
        const res = await templateEngine.compile('verify-email.html', {
            verificationCode,
            displayName,
        });

        expect(typeof res).toBe('string');
        expect(res).toContain(verificationCode);
        expect(res).toContain(displayName);
    });
});
