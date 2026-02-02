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
    "revision": "014f486fd8ec52b85f60e0cbd755dd37"
  }, {
    "url": "assets/utils-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-tH7iON3s.js",
    "revision": null
  }, {
    "url": "assets/ui-BSo4o6d7.js",
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
    "url": "assets/index-Cs0Dxhuu.css",
    "revision": null
  }, {
    "url": "assets/index-BxGTOJPj.js",
    "revision": null
  }, {
    "url": "assets/gardenService-DDe_QMHV.js",
    "revision": null
  }, {
    "url": "assets/core-D_ggjJUd.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-CZfsu4WM.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-Bti_qMRl.js",
    "revision": null
  }, {
    "url": "assets/VagasList-Dj89tyH3.js",
    "revision": null
  }, {
    "url": "assets/TribeView-CujLiXXc.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-WtcHGHW3.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-CV9KujNj.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-DQd7-FZH.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-g4g8d8PZ.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-D6or8-Ui.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-CwS3EzTo.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-CPFdTBWW.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-SpP3-TA8.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-BfUXoZGJ.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-CHLKUGnj.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-eTUuQn7W.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-DIKRCyL_.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-DW5OK178.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-AHH1TF3N.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-BCFPFaqA.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-Cde6Bpif.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-XxnAE2E2.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-BQ4ViWri.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-Cradbk83.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-DgYjMYyO.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-DvU66uVK.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-BljF81iQ.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-GbiT7wXX.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-DCVVPLpd.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-DDk7fE2t.js",
    "revision": null
  }, {
    "url": "assets/SpaceAuditLog-DmMNojRy.js",
    "revision": null
  }, {
    "url": "assets/SoulPactInteraction-03F-AE9z.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-BU3nLLAk.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-DwrUzUNw.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-BK-rXAn5.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-BLP5NKrD.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-BqykU26g.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-ryTHVgM9.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-BsB_69_S.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-RhnUAS6B.js",
    "revision": null
  }, {
    "url": "assets/Registration-nhQbkhf4.js",
    "revision": null
  }, {
    "url": "assets/RadianceDrilldown-ClhNXmf_.js",
    "revision": null
  }, {
    "url": "assets/ProViews-Bq280MHk.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-CkXC4vcb.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-CmGEbaM2.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-Bkilj7xd.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-Bn30bq3R.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-DVwb9zUE.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-BpJzYrUD.js",
    "revision": null
  }, {
    "url": "assets/PredictiveOccupancy-Bib6IHxU.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-F9cC1YYY.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-C_oUbdHT.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-RCKCtuQW.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-Byrnu95r.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-D4nJL-EB.js",
    "revision": null
  }, {
    "url": "assets/OracleView-4MqQdD41.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-CKkrcR0E.js",
    "revision": null
  }, {
    "url": "assets/OracleCardPremium-S_eJcqZ8.js",
    "revision": null
  }, {
    "url": "assets/OfflineRetreat-CSL4qIfh.js",
    "revision": null
  }, {
    "url": "assets/MicroInteraction-hHkGlF_5.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-TYUfnOFv.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-C37obDew.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-HosLcaL-.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-B66xYQsr.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-L1v2ySHR.js",
    "revision": null
  }, {
    "url": "assets/HealingCircleEntry-BFcZh0h4.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-eI9m2w0Z.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-puepbA6B.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-BOGNkmtU.js",
    "revision": null
  }, {
    "url": "assets/CustomInterventionWizard-Ll6jeuVC.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-YFUMe5sl.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-CdxrQAZ-.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-D0CFZw04.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-CqepBAc1.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-Dt5l8apD.js",
    "revision": null
  }, {
    "url": "assets/Checkout-CFF06Pdr.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-Chj4n23i.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-BIclFYRc.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-DWJwTTDf.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-B-LziwGW.js",
    "revision": null
  }, {
    "url": "assets/Auth-D9ai0q9U.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-BvDhw1H9.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-DFC1OOrf.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-hEaB9QFX.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-DIEGhBoU.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-vu7bMH2Q.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ee6279a921394bdeb776770e685cca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
