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
    "revision": "c3280dfc9c359f83a0348877b1501e1d"
  }, {
    "url": "assets/utils-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-tH7iON3s.js",
    "revision": null
  }, {
    "url": "assets/ui-D3_e8TMZ.js",
    "revision": null
  }, {
    "url": "assets/sharing-DTQpxHD8.js",
    "revision": null
  }, {
    "url": "assets/phraseService-1V-GDPik.js",
    "revision": null
  }, {
    "url": "assets/index-CkTXcLcF.css",
    "revision": null
  }, {
    "url": "assets/index-CMA6jFR7.js",
    "revision": null
  }, {
    "url": "assets/gardenService-DDe_QMHV.js",
    "revision": null
  }, {
    "url": "assets/core-D_ggjJUd.js",
    "revision": null
  }, {
    "url": "assets/constants-BvHIlypo.js",
    "revision": null
  }, {
    "url": "assets/ZenSkeleton-CBGVrj7T.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-Bz0Vql4k.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-0lcFb6aR.js",
    "revision": null
  }, {
    "url": "assets/VagasList-DqVSUBZG.js",
    "revision": null
  }, {
    "url": "assets/TribeView-Odz4KEDd.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-PspI9Oq9.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-Cpw5B22q.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-fNHq45Te.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-BRk7wz3P.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-BGDq8Kmn.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-sPPrUVMq.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-GYFADhV3.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-C6x4_nwY.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-BgzM1_qo.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-oWxlonlR.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-BoMV60GZ.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-D4yooTD1.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-CS3C1a4Z.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-BNVUeLHN.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-BTwQou0S.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-xIk2emC9.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-BTnVjyyP.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-CgsoTweq.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-xwULlosY.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-DrDJc2-m.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-BmtCZ_VW.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-BFNw8zBl.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-DkNbZAMd.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-BJA8tmgL.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-B9pzFLdl.js",
    "revision": null
  }, {
    "url": "assets/SpaceAuditLog-BV8Lp6b1.js",
    "revision": null
  }, {
    "url": "assets/SoulPactInteraction-BwR2GvJs.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-_I6gxDRb.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-BnWmoGn_.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-Ln0aZq4V.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-DVPcMqnk.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-BM-vDX1X.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-BfUr4TFe.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-wYJ8XEG_.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-Cm0CH_Et.js",
    "revision": null
  }, {
    "url": "assets/Registration-CczSCLIN.js",
    "revision": null
  }, {
    "url": "assets/RadianceDrilldown-R6zgyaUT.js",
    "revision": null
  }, {
    "url": "assets/ProductFormModal-S-YoUHkH.js",
    "revision": null
  }, {
    "url": "assets/ProViews-qxfaJ3te.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-Dne3bmVD.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-BW8rMs3w.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-D6xtbE_Z.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-BpHx71iX.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-BwVhb0ob.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-C41G7N6c.js",
    "revision": null
  }, {
    "url": "assets/PredictiveOccupancy-4H8QhDak.js",
    "revision": null
  }, {
    "url": "assets/PortalView-Buuu52b5.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-BRIcr7BW.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-9qfP5sMV.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-CQt8gePY.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-DyeXjUwF.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-oU4edogS.js",
    "revision": null
  }, {
    "url": "assets/OracleView-N2kawQIR.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-sCYWubaE.js",
    "revision": null
  }, {
    "url": "assets/OracleCardPremium-GMGxVYYZ.js",
    "revision": null
  }, {
    "url": "assets/OfflineRetreat-BASJ694t.js",
    "revision": null
  }, {
    "url": "assets/MicroInteraction-pH7Lq4Ws.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-DcZmcaWT.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-Zw5AeLPg.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-MeiCpZx8.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-BvKuXJcU.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-rE82_xyX.js",
    "revision": null
  }, {
    "url": "assets/HealingCircleEntry-BrkCp_50.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-C_WeHMhv.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-DeneFxvi.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-DknsWtW1.js",
    "revision": null
  }, {
    "url": "assets/DynamicAvatar-BaQIHIEi.js",
    "revision": null
  }, {
    "url": "assets/CustomInterventionWizard-CZQshgOy.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-DFS8kgvw.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-Bm7Ja5vE.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-DA5-rZL-.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-CvAkK5YM.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-DnbV83_S.js",
    "revision": null
  }, {
    "url": "assets/Checkout-Dy_0INBx.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-BoYr4VKJ.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-BN8PzF9d.js",
    "revision": null
  }, {
    "url": "assets/Cards-CsuMzI3q.js",
    "revision": null
  }, {
    "url": "assets/CameraWidget-PQHr0auE.js",
    "revision": null
  }, {
    "url": "assets/BottomSheet-DsATfhKa.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-DdeVbPwO.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-BeWkG90W.js",
    "revision": null
  }, {
    "url": "assets/Auth-DLP5zCQX.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-Bt2WWYi1.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-CsyocnZh.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-CUr11gbi.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-pLAIH9rk.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-8tr4QS3R.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ee6279a921394bdeb776770e685cca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
