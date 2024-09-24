// swiftchat.module.ts

import { Module } from '@nestjs/common';
import { SwiftchatMessageService } from './swiftchat.service';
import { MessageModule } from 'src/message/message.module'; 
import { MixpanelService } from 'src/mixpanel/mixpanel.service';

@Module({
  imports: [MessageModule],
  providers: [SwiftchatMessageService, MixpanelService],
  exports: [SwiftchatMessageService],
})
export class SwiftchatModule {}
