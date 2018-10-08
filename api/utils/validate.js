import ZSchema from 'z-schema';


const validator = new ZSchema({
  breakOnFirstError: false,
  reportPathAsArray: true,
});


export class SchemaValidationError extends Error {
  constructor(message) {
    super(message);
    Error.captureStackTrace(this, SchemaValidationError);
  }
}


export default function validate(schema, data) {
  return new Promise((resolve, reject) => {
    validator.validate(data, schema, (errors, valid) => {
      if (valid) {
        resolve();
        return;
      }

      // err.errr = errors.reduce((acc, error) => {
      //   acc[error.path.join('.') || error.params] = { code: error.code, message: error.message };
      //   return acc;
      // }, {});

      const err = new SchemaValidationError('Schema Validation Failed');
      err.data = errors.map(error => ({ field: (error.path.join('.') || error.params).toString(), code: error.code, message: error.message }));
      reject(err);
    });
  });
}

// const schema = {
//   type: 'object',
//   required: [
//     'onderwerp',
//     'notities',
//     'proces',
//   ],
//   properties: {
//     id: {
//       type: 'string',
//       readOnly: true,
//     },
//     fotos: {
//       type: 'array',
//       items: {
//         type: 'string',
//         appsembleFile: {
//           type: [
//             'image/jpeg',
//           ],
//         },
//       },
//       title: 'Foto’s',
//     },
//     gebied: {
//       type: 'string',
//       readOnly: true,
//     },
//     proces: {
//       enum: [
//         'Fietsknip team',
//         'Handhaving',
//         'Heel en Groen',
//         'Inzameling',
//       ],
//       title: 'Proces',
//     },
//     locatie: {
//       type: 'object',
//       title: 'GeoCoordinates',
//       properties: {
//         latitude: {
//           type: 'number',
//         },
//         longitude: {
//           type: 'number',
//         },
//       },
//     },
//     notities: {
//       type: 'string',
//       title: 'Notities',
//     },
//     onderwerp: {
//       type: 'string',
//       title: 'Onderwerp',
//     },
//     created_at: {
//       type: 'string',
//       format: 'date-time',
//       readOnly: true,
//     },
//   },
// };

// const value = {
//   fotos: [],
//   gebied: 'nederlandse antillen',
//   proces: 'Fietsknip team',
//   locatie: { foo: 'this is not validated' },
//   notities: '',
//   onderwerp: '',
// };

// async function f() {
//   try {
//     await validate(schema, value);
//   } catch (e) { console.log(e); }
// }

// f();
