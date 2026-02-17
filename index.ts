import { registerRootComponent } from 'expo';

import App from './App';


import { TextEncoder, TextDecoder } from 'text-encoding';
import 'react-native-get-random-values'; // Se der erro pedindo isso, instale: npm i react-native-get-random-values

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
