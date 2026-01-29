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
    "revision": "2209ac02372529dde1c51c69f6ddcf4a"
  }, {
    "url": "assets/vendor-Ce3QztoP.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-C8ppj1qT.js",
    "revision": null
  }, {
    "url": "assets/paymentMock-D4WmpuvJ.js",
    "revision": null
  }, {
    "url": "assets/index-BY-ICmP2.js",
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
    "url": "assets/WalletViewScreen-Bvwibbi-.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-B_C-Nwsq.js",
    "revision": null
  }, {
    "url": "assets/VagasList-CkdJyHKI.js",
    "revision": null
  }, {
    "url": "assets/TribeView-CEL9-I97.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-CsBhUQiT.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-AjWphhtt.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-BoZIQuUr.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-BzDCPH6G.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-C_FruD0Z.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-C2n2Zo8B.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-ui3ceZIU.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-DG-gN7LD.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-DiA5GPbM.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-CPKdiOoX.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-BTTtUQnq.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-BmwUCNV3.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-G2qbeKxM.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-DR3nSkH0.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-4bz1BKZJ.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-BSGOhH0C.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-Dj4_SJ3I.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-xaPbBcAq.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-DxaR1vc5.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-B1et3AlX.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-CERxhrLK.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-BW4wDwcM.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-Bq6_B0Ty.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-G6y9QnkJ.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-BFhTaY6y.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-fGvsGlvF.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-9IT_6eHw.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-Dmsn3c7t.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-PMtKfYLa.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-QEA3gJBD.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-CJW8KpeR.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-DVw-mojm.js",
    "revision": null
  }, {
    "url": "assets/Registration-C3sY6-ej.js",
    "revision": null
  }, {
    "url": "assets/ProViews-BCltE_TG.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-Du-v3809.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-CvhzDTB-.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-BBOzus1Q.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-CdZwS9nm.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-tkh_NX_x.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-59u1UINH.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-BfCWVKJY.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-CnovfqsK.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-Bahlxdj-.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-RtbTWnw-.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-tvq8TkHg.js",
    "revision": null
  }, {
    "url": "assets/OracleView-BNxulkzO.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-BQEkwUmD.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-CHv6gs_1.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-D5zge3zp.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-Bl8QrFs6.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-CPAS3dmw.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-CKy9hEG-.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-bXW_dPVx.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-xbKluZPT.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-JiYLi6Iw.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-Yo0qAIBH.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-X2geM-A8.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-BdZiZ4ns.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-Bx3Zlddg.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-Dq5bL_ps.js",
    "revision": null
  }, {
    "url": "assets/Checkout-D7Jm3qHk.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-DVEJAt3R.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-CzQ4RqOq.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-C9W06DXz.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-DDY3Pd9a.js",
    "revision": null
  }, {
    "url": "assets/Auth-CYQitlE1.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-pgFxxKKs.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-60A8xexO.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-DbLgue4V.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-d0qNskiq.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-BNbxCoFg.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "596683ddeddff0f6b9a2fcf15fb415ed"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
//# sourceMappingURL=sw.js.map
