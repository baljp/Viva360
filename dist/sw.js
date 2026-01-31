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
    "revision": "bbf025ac2404188437d02a0bf6a26eaf"
  }, {
    "url": "assets/utils-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-tH7iON3s.js",
    "revision": null
  }, {
    "url": "assets/ui-BrUYc1yp.js",
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
    "url": "assets/index-G8mPzu_j.css",
    "revision": null
  }, {
    "url": "assets/index-BpCnQDzP.js",
    "revision": null
  }, {
    "url": "assets/gardenService-CDsGg8mD.js",
    "revision": null
  }, {
    "url": "assets/core-D_ggjJUd.js",
    "revision": null
  }, {
    "url": "assets/chatMock-C-gJQrm7.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-BdUDTeVF.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-BERP8DEF.js",
    "revision": null
  }, {
    "url": "assets/VagasList-Bhnr8Plq.js",
    "revision": null
  }, {
    "url": "assets/TribeView-BlmAZ-KZ.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-WLAz4aaw.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-BJCN4uQJ.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-CwyfmMPl.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-mu1lhcuO.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-DuV7nn8x.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-1sqBqSAZ.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-Czfg1Nu2.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-B5jt1KFS.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-pbE6agRz.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-Dtp62fzJ.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-DXnKsL25.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-B_2rGotj.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-BOefbNNB.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-BdmHRbnY.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-DQk4A8yQ.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-DrfgR4g_.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-Brg43CwP.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-DMUfpBKb.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-Crw21lK4.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-ClaqO_ZQ.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-C1c7L0LP.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-CRqVbT1v.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-9Eqg4LlO.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-CTz4JHoS.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-C1lJlOPY.js",
    "revision": null
  }, {
    "url": "assets/SpaceAuditLog-B9MhKiVM.js",
    "revision": null
  }, {
    "url": "assets/SoulPactInteraction-DOwPpLDj.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-DaNrOV3F.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-Dgsh9iNn.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-99QFG0BD.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-2SPcJsA9.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-I1jcyvO8.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-BS4G2suk.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-DMzvCyeJ.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-Ku0rydzH.js",
    "revision": null
  }, {
    "url": "assets/Registration-DuqnLa62.js",
    "revision": null
  }, {
    "url": "assets/RadianceDrilldown-BaCh0o5i.js",
    "revision": null
  }, {
    "url": "assets/ProViews-Dq8pQRgk.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-CMJ89vP_.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-BmD6X1A4.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-B4junuS_.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-C-TQGNq7.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-CcMNDcuO.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-CiE_tF69.js",
    "revision": null
  }, {
    "url": "assets/PredictiveOccupancy-B7fsuabm.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-D7njx2_n.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-BXwCNgA0.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-CaBxFZhw.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-Cbw-ILBk.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-MzF-PZTP.js",
    "revision": null
  }, {
    "url": "assets/OracleView-CTDy8U8W.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-CmCoZtFc.js",
    "revision": null
  }, {
    "url": "assets/OracleCardPremium-DdCOZzMu.js",
    "revision": null
  }, {
    "url": "assets/OfflineRetreat-B3Rvr3om.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-CnQZ5ZoT.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-CpN6dJoM.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-D1B6UngE.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-CP663X54.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-BarjQxgD.js",
    "revision": null
  }, {
    "url": "assets/HealingCircleEntry-BzqX4kj7.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-B3KLvMhZ.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-6wQWdgiL.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-D4gIuzkR.js",
    "revision": null
  }, {
    "url": "assets/CustomInterventionWizard-CxWH4bEp.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-CShEmOkx.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-CFlBpbTo.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-enIumiad.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-BhiL_g2U.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-CVkdyH57.js",
    "revision": null
  }, {
    "url": "assets/Checkout-2_w-WTn2.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-D6TzH0yc.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-DOEiYPbm.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-B_ZN373E.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-Bu8ez7E8.js",
    "revision": null
  }, {
    "url": "assets/Auth-Cb4nFe61.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-5AdSA8xU.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-B1hpYqiG.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-F2V8mBBd.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-B30VF3qM.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-C0usFh8_.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ee6279a921394bdeb776770e685cca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
