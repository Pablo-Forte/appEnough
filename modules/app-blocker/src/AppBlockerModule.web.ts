import { registerWebModule, NativeModule } from 'expo';

class AppBlockerModule extends NativeModule<{}> {}

export default registerWebModule(AppBlockerModule, 'AppBlockerModule');
