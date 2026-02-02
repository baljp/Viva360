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
    "revision": "aa853378b418f34a90becd9db62b79b5"
  }, {
    "url": "assets/utils-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-tH7iON3s.js",
    "revision": null
  }, {
    "url": "assets/ui-DQy1fwM-.js",
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
    "url": "assets/index-IGsqu0rc.js",
    "revision": null
  }, {
    "url": "assets/index-C5snzR7M.css",
    "revision": null
  }, {
    "url": "assets/gardenService-DDe_QMHV.js",
    "revision": null
  }, {
    "url": "assets/core-D_ggjJUd.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-C3G3Xwh9.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-vCD0fKsq.js",
    "revision": null
  }, {
    "url": "assets/VagasList-DS9BVITw.js",
    "revision": null
  }, {
    "url": "assets/TribeView-DLlOyjqe.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-ejhCLuvS.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-DRRs2WfP.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-noUwDZDK.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-DpAgp3UA.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-DrG41GsK.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-CP0IzxZx.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-dUSmC0gl.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-dvQYMkiE.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-C_7S6d0m.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-BtOlN1BP.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-E4HWeVJE.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-QxS6PmUR.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-BZ-KS9GA.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-CGrib4Nt.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-BJbHZ00i.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-BuI-5hfs.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-CElsECef.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-BFItZDVv.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-Del5-LJ_.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-BRXvVtej.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-Dt6Vypas.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-pRo8iclQ.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-B2Qg4ahc.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-3jBuruMR.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-DWgfmu5q.js",
    "revision": null
  }, {
    "url": "assets/SpaceAuditLog-Cb7cK-0Z.js",
    "revision": null
  }, {
    "url": "assets/SoulPactInteraction-BsucYiWh.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-CoJOPRWm.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-CMMhWH9t.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-CDi6FTIU.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-ChchZhmV.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-D1UcB270.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-x3K-N7iD.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-DhmIZ2N-.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-B9aRJA_p.js",
    "revision": null
  }, {
    "url": "assets/Registration-DaapmRB0.js",
    "revision": null
  }, {
    "url": "assets/RadianceDrilldown-CK0RTijn.js",
    "revision": null
  }, {
    "url": "assets/ProViews-BZdIwZiJ.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-PzKSoSdx.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-CRBwtV07.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-CoEZIkhf.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-BFcIwrjw.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-CyCrsWP0.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-CJUe6rl4.js",
    "revision": null
  }, {
    "url": "assets/PredictiveOccupancy-BkLVhdmn.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-DQbXHx1c.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-C3hSfilX.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-CNP7A4v1.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-CB1U-Q_k.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-DDzUU9iD.js",
    "revision": null
  }, {
    "url": "assets/OracleView-DVLqcVaw.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-1zuJpg7N.js",
    "revision": null
  }, {
    "url": "assets/OracleCardPremium-BhZVETFe.js",
    "revision": null
  }, {
    "url": "assets/OfflineRetreat-CLEorU2x.js",
    "revision": null
  }, {
    "url": "assets/MicroInteraction-4sIifJdV.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-ZBbkEhjb.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-DkTFCKxY.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-DdZoReF3.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-Cz6LSylg.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-JnV_BTiq.js",
    "revision": null
  }, {
    "url": "assets/HealingCircleEntry-DBo38XAD.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-DhmTPb7s.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-E7_fzUOW.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-Vm6cgRZu.js",
    "revision": null
  }, {
    "url": "assets/CustomInterventionWizard-D0EurYwo.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-BmCWNT1Q.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-DhjjFrU0.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-B45BKfMD.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-BqFPZrnK.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-_dpQddC0.js",
    "revision": null
  }, {
    "url": "assets/Checkout-C-maJ0OG.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-eqkIIWDe.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-BTI5RsZX.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-BgGL69fa.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-DE4R1MuB.js",
    "revision": null
  }, {
    "url": "assets/Auth-DnJrs3UI.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-Db8RRX13.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-Co85LhC7.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-D1bGW0zc.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-lX7Hm6Ef.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-C07uKpN_.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ee6279a921394bdeb776770e685cca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
