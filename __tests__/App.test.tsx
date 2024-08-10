/**
 * @format
 */

import 'react-native';
import React from 'react';
<<<<<<< HEAD
import App from '../src/App';
=======
import App from '../App';
>>>>>>> c93409499068fcd66437c8ad6b6620a335080666

// Note: import explicitly to use the types shipped with jest.
import {it} from '@jest/globals';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  renderer.create(<App />);
});
