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
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "index.html",
    "revision": "0b25a176589cee0e6cb5e16d19b829cf"
  }, {
    "url": "assets/utils-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-tH7iON3s.js",
    "revision": null
  }, {
    "url": "assets/ui-aPjwtztf.js",
    "revision": null
  }, {
    "url": "assets/sharing-DTQpxHD8.js",
    "revision": null
  }, {
    "url": "assets/phraseService-1V-GDPik.js",
    "revision": null
  }, {
    "url": "assets/paymentMock-D4WmpuvJ.js",
    "revision": null
  }, {
    "url": "assets/index-Dlewp8jh.js",
    "revision": null
  }, {
    "url": "assets/index-Cs0Dxhuu.css",
    "revision": null
  }, {
    "url": "assets/gardenService-DDe_QMHV.js",
    "revision": null
  }, {
    "url": "assets/core-D_ggjJUd.js",
    "revision": null
  }, {
    "url": "assets/chatMock-C-gJQrm7.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-B7bHgV3g.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-BugqmZhN.js",
    "revision": null
  }, {
    "url": "assets/VagasList-Cmu_EMLo.js",
    "revision": null
  }, {
    "url": "assets/TribeView-UlN1p1Yb.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-DyUtSBpz.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-Bf9oLplu.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-Bxi9nAPl.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-Bvb2sbBq.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-D355KR6c.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-DGQkJX9h.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-DiyI1qF5.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-Bat3-cjd.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-b-EVlO1x.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-4GvL3jGl.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-CcJsQ4M0.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-hfyNryh1.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-V1X44RKZ.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-Bs92dnFC.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-Bq7jewYI.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-DKt8qD2X.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-yVsNOhcV.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-BblqRW9L.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-CpxxGjpo.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-_2zf4bI7.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-D9l_NEuA.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-C5QvCP3F.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-Dgq6QNmC.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-D6q2tDCp.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-JbQbXREe.js",
    "revision": null
  }, {
    "url": "assets/SpaceAuditLog-Bnbw2EPM.js",
    "revision": null
  }, {
    "url": "assets/SoulPactInteraction-BaAorz2L.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-lP9nwJ6Z.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-Da5Tj8HP.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-BaF_vcZw.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-gKzOqfqD.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-B-Zuf5a1.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-dMjItyMw.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-xg6RN40F.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-B-KiqHG-.js",
    "revision": null
  }, {
    "url": "assets/Registration-CHu-k4mq.js",
    "revision": null
  }, {
    "url": "assets/RadianceDrilldown-B9OX-8uw.js",
    "revision": null
  }, {
    "url": "assets/ProViews-Dbh2yTY_.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-Cv2WSRkt.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-h4FfZ-0l.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-D1vu0OJk.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-BByPMBrG.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-CJz2EdPY.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-CC6JLuLX.js",
    "revision": null
  }, {
    "url": "assets/PredictiveOccupancy-BJsR-TBO.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-cLgSTYhr.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-fKIhIHmV.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-Cmr6h_75.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-BL4U9hmJ.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-lhv3-1Ry.js",
    "revision": null
  }, {
    "url": "assets/OracleView-B1SHABui.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-Vr6xbn_K.js",
    "revision": null
  }, {
    "url": "assets/OracleCardPremium-G93NJ7u7.js",
    "revision": null
  }, {
    "url": "assets/OfflineRetreat-Dacw-zPW.js",
    "revision": null
  }, {
    "url": "assets/MicroInteraction-CQ1f_POb.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-BHfm5oyQ.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-CmDYy3h8.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-DRsL74lV.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-3goJVDc1.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-RuY8tdfX.js",
    "revision": null
  }, {
    "url": "assets/HealingCircleEntry-1lDyPn1q.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-CC9-bVC2.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-DTDz-JX5.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-Ds7Dn_tt.js",
    "revision": null
  }, {
    "url": "assets/CustomInterventionWizard-CzGmxrZA.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-BnsGCaBq.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-WV3I672H.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-CcSvY1TC.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-CO-I_t3Z.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-C1KarTNp.js",
    "revision": null
  }, {
    "url": "assets/Checkout-Bb1aspzv.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-CE6IZLLp.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-D5oy-cDV.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-BcypyBGn.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-4KWLEAi6.js",
    "revision": null
  }, {
    "url": "assets/Auth-DhyOhUWq.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-DGo8WxlF.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-BdSaAmsT.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-DiuwDcri.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-D-LhpcvZ.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-DU9W2mbl.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ee6279a921394bdeb776770e685cca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
