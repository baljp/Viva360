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
    "revision": "64b71373a13d51d493443417bcb2c7d7"
  }, {
    "url": "assets/vendor-DHHl5T5h.js",
    "revision": null
  }, {
    "url": "assets/paymentMock-D4WmpuvJ.js",
    "revision": null
  }, {
    "url": "assets/index-Bc8ADf7U.js",
    "revision": null
  }, {
    "url": "assets/index-BAtWe9iT.css",
    "revision": null
  }, {
    "url": "assets/gardenService-sSBhMfQs.js",
    "revision": null
  }, {
    "url": "assets/chatMock-C-gJQrm7.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-CPBRgDz6.js",
    "revision": null
  }, {
    "url": "assets/VagasList-Csy-sRK8.js",
    "revision": null
  }, {
    "url": "assets/TribeView-DCPYqaWG.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-DlpB_Bl1.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-BhO7A5LU.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-Bsjuw1Ht.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-LwEoqVVq.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-AQHP9dBB.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-Bc6hMcUi.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-DpysX_gb.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-CJun4hLx.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-CbFCG6PF.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-DZzg8OWn.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-D58vBbd4.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-BYTL7HpI.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-1zgOT6NV.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-Dp9mAQ-V.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-DlnHrfnx.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-DHTgSzuu.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-lJFWDwG4.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-DAojvBiP.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-CcGl9gdk.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-C6XUhGDx.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-DG5LU2IC.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-_-nqyNwc.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-Bt5pvFzY.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-C1qdASIK.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-CeOqfrYj.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-BrUE792g.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-BShwN3Q6.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-sWdGiz9R.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-CKg7F2bR.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-z97nUyvP.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-D6tWuG3y.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-DFn2sYoL.js",
    "revision": null
  }, {
    "url": "assets/Registration-CEZd5Xpg.js",
    "revision": null
  }, {
    "url": "assets/ProViews-BaQYegFO.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-FMI1VJwB.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-CQqK4P4K.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-Cu1gXmIm.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-CiFGnJww.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-CYPOCAE3.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-B9FY32t5.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-BDw6D6Uj.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-g87ClqYA.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-BbLvE5Ct.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-CdWeNUDb.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-Cg2EGQIw.js",
    "revision": null
  }, {
    "url": "assets/OracleView-D44f1la9.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-COfV_vbv.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-CGl67aRq.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-Bw-g7Qi6.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-CEbMK_cJ.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-BB7UIc8t.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-Bv9BxD62.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-Bp-eZhmy.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-BQjQupCg.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-BeD_Oyc3.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-Dqz-me1s.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-CyDv1sDn.js",
    "revision": null
  }, {
    "url": "assets/Checkout-BVZ4GFjI.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-DJcF0jKh.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-o1yCYyCy.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-6NrLO5RG.js",
    "revision": null
  }, {
    "url": "assets/BookingSearch-BLtn561N.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-BZ4dcxJ8.js",
    "revision": null
  }, {
    "url": "assets/Auth-CUi0wrpL.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-Dd9Te15X.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-Cd8pWoz3.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-Yronduk-.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-DQSkpuTx.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-DifTdU8C.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "596683ddeddff0f6b9a2fcf15fb415ed"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
//# sourceMappingURL=sw.js.map
