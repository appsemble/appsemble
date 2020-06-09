import urlB64ToUint8Array from './urlB64ToUint8Array';

const tests = {
  '': Uint8Array.from([]),
  CG: Uint8Array.from([8]),
  'CG==': Uint8Array.from([8]),
  '8J+QsQo': Uint8Array.from([240, 159, 144, 177, 10]),
  '8J+QsQo=': Uint8Array.from([240, 159, 144, 177, 10]),
  '8J+QsfCfkLEK': Uint8Array.from([240, 159, 144, 177, 240, 159, 144, 177, 10]),
  '8J+QsfCfkLHwn5CxCg': Uint8Array.from([
    240,
    159,
    144,
    177,
    240,
    159,
    144,
    177,
    240,
    159,
    144,
    177,
    10,
  ]),
  '8J+QsfCfkLHwn5CxCg==': Uint8Array.from([
    240,
    159,
    144,
    177,
    240,
    159,
    144,
    177,
    240,
    159,
    144,
    177,
    10,
  ]),
  'c3ViamVjdHM/Cg==': Uint8Array.from([115, 117, 98, 106, 101, 99, 116, 115, 63, 10]),
};

it.each(Object.entries(tests))('should convert %s to %s', (input, expected) => {
  const result = urlB64ToUint8Array(input);
  expect(result).toStrictEqual(expected);
});
