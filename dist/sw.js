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
    "revision": "34169d10ae910ce74734bf52f2d154f5"
  }, {
    "url": "assets/utils-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-tH7iON3s.js",
    "revision": null
  }, {
    "url": "assets/ui-B5ZlBfss.js",
    "revision": null
  }, {
    "url": "assets/paymentMock-D4WmpuvJ.js",
    "revision": null
  }, {
    "url": "assets/index-BCQyMlXm.js",
    "revision": null
  }, {
    "url": "assets/index-BAtWe9iT.css",
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
    "url": "assets/WalletViewScreen-Cf0KrYJW.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-DeNq7b-z.js",
    "revision": null
  }, {
    "url": "assets/VagasList-BALip2bI.js",
    "revision": null
  }, {
    "url": "assets/TribeView-0Ovo-srl.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-CzzN0IyT.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-CeNynz02.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-D6d6yJQM.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-jNgS9ZQ9.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-Lzz_P8kn.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-CY0J7Zs7.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-gWrRAzes.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-CnsP8mgz.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-3GZ0IcoN.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-Dyky5bol.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-BwM_V7FH.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-D0AFKMbd.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-vZDPHowA.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-Br6BGQ6T.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-CkZqrTtQ.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-Bv_gH_dq.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-DriQO870.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-DEJ6hQ75.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-B8rO6N6-.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-Dextftdk.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-vS88P_Lq.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-CHudRt-Y.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-BbGMqHUk.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-Bps39BvI.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-DXy1ljpo.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-BW1vBUUN.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-BDop78lJ.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-D-2qOTef.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-CEPr2ReC.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-CYqfLC4r.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-BW3MLPuO.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-CYPno-Nn.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-YNDcbWBt.js",
    "revision": null
  }, {
    "url": "assets/Registration-Bb3Bkh3F.js",
    "revision": null
  }, {
    "url": "assets/ProViews-DpFqx4HR.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-BpNUitj8.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-Cjz6hxW7.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-C1R6JLoQ.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-ByLA9Dig.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-D_kfzb9H.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-C-mPOUdh.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-BvAVenRB.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-BF23V1yh.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-DHOdn-TW.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-DokiBrkD.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-DzS1ZLS0.js",
    "revision": null
  }, {
    "url": "assets/OracleView-BvYEmDEQ.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-BzMK2UER.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-CResjvlF.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-D7w26H_L.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-D5XMhuU_.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-Cf-wKxLI.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-CZHNgP_1.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-Dc270kRj.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-CZsq1hrV.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-kqDd-ur3.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-pEeaVmfD.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-AXrp55ii.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-7j2H_yxh.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-TrdTAzJD.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-3JrIHOFr.js",
    "revision": null
  }, {
    "url": "assets/Checkout-ghtkyd2V.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-D4skJcvE.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-C4lDIEa8.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-BbpGe4ri.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-ByI93AWt.js",
    "revision": null
  }, {
    "url": "assets/Auth-CHqaPprc.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-D48dL2Hb.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-DGUhkKbu.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-BD_qNrPb.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-l8XYuq_E.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-C4JF44lp.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ee6279a921394bdeb776770e685cca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
