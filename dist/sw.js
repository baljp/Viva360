/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5a5d9309'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "index.html",
    "revision": "8fbec8a83b06fec5d876f9fd1b857838"
  }, {
    "url": "assets/vendor-Do7JSmQQ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards--t0bCjYQ.js",
    "revision": null
  }, {
    "url": "assets/paymentMock-D4WmpuvJ.js",
    "revision": null
  }, {
    "url": "assets/index-BF6vjQhO.js",
    "revision": null
  }, {
    "url": "assets/index-BAtWe9iT.css",
    "revision": null
  }, {
    "url": "assets/gardenService-aNb6SKEA.js",
    "revision": null
  }, {
    "url": "assets/chatMock-C-gJQrm7.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-C4BQG1J0.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-C3W6swf5.js",
    "revision": null
  }, {
    "url": "assets/VagasList-03r5_BIW.js",
    "revision": null
  }, {
    "url": "assets/TribeView-BnTCAkj2.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-B-AYb5bC.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-BcxL5Bdt.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-BEi16WJ3.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-C81igyQz.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-DgivulVy.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-B3MOLjzs.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-DwDoY0q1.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-BQwRRqFb.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-C7qKcHfQ.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-BSXe6VI5.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-Dj3BprYp.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-BFxcLrfy.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-D6vGUH40.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-Cj3Pm23E.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-KYL_RmXu.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-xbAtqeXh.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-CvF1HQ-3.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-D0D54qe6.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-2EGdij85.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-D9_qJeDG.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-LszbuoO7.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-Cni2e0of.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-9nmha-UY.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-DCV7XTcj.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-Dtp2kILa.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-CRR1no87.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-DBJucDIb.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-CnH9Pc_a.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-BBo6beh-.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-BPWtgsXP.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-muBcGwEs.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-CPwvtDm7.js",
    "revision": null
  }, {
    "url": "assets/Registration-ItUBPrEz.js",
    "revision": null
  }, {
    "url": "assets/ProViews-DNDQYPNs.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-B4775I37.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-Dc18O9KI.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-B87SPCEU.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-CdgBkxJf.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-PTvQWDsW.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-Pqq8gbJ-.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-pu-SKZAm.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-D1y6_dC4.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-BxxOh-gt.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-dwOaiKpQ.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-BM5QCLus.js",
    "revision": null
  }, {
    "url": "assets/OracleView-BZch_iC4.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-C7TX5a57.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-B3MJgVP6.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-gBCUuDfa.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-DJl6YWev.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-DPk5Lf7M.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-DkHwtAlb.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-BdDXrPbK.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-BhEOBEu2.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-wp_HoMxr.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-B9p_WeOM.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-BQWqG-WH.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-kef-HJYO.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-C066YWVX.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-CHpUi8lv.js",
    "revision": null
  }, {
    "url": "assets/Checkout-acq9kd-_.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-DSgLianI.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-D3fpKuRN.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-H89Xcuop.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-QfDNdqtD.js",
    "revision": null
  }, {
    "url": "assets/Auth-DUWzpI7b.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-C_0UbkwV.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-Dynv55g9.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-BWSHWB7b.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-D9Evz4ZS.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-CYBOkGGY.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "596683ddeddff0f6b9a2fcf15fb415ed"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
//# sourceMappingURL=sw.js.map
