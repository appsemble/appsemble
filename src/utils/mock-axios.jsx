import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';


const mock = new MockAdapter(axios);


mock
  .onGet('https://localhost:9999/markers/').reply(200, [
    {
      lat: 52.3960472,
      lon: 4.8948808,
    },
  ])
  .onGet(/.*\..*/).passThrough();
