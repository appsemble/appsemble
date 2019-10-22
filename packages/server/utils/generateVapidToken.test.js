import generateVapidToken from './generateVapidToken';

describe('generateVapidToken', () => {
  it('should generate a VAPID token', () => {
    const result = generateVapidToken();
    expect(result).toStrictEqual({
      publicKey: expect.any(String),
      privateKey: expect.any(String),
    });
  });
});
