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
    "revision": "4fde608cf6968fbc62724a394f069a67"
  }, {
    "url": "assets/utils-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-RJtYtAbU.js",
    "revision": null
  }, {
    "url": "assets/ui-BCRPN8Os.js",
    "revision": null
  }, {
    "url": "assets/sharing-DTQpxHD8.js",
    "revision": null
  }, {
    "url": "assets/phraseService-1V-GDPik.js",
    "revision": null
  }, {
    "url": "assets/index-CQVOt2En.js",
    "revision": null
  }, {
    "url": "assets/index-Bx5-R3RX.css",
    "revision": null
  }, {
    "url": "assets/gardenService-DDe_QMHV.js",
    "revision": null
  }, {
    "url": "assets/core-9DaWj-XE.js",
    "revision": null
  }, {
    "url": "assets/constants-BvHIlypo.js",
    "revision": null
  }, {
    "url": "assets/ZenSkeleton-DfCUJuH3.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-CFnZ81Sj.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-aDrdnz4w.js",
    "revision": null
  }, {
    "url": "assets/VagasList-C2_RUubK.js",
    "revision": null
  }, {
    "url": "assets/TribeView-Dx0_xuxj.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-BuDgYmV_.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-UF-4sZ2w.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-BIDPo_KV.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-A4zN_ALj.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-B1HyV6fL.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-Bhw6GF5e.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-BaZx4vCA.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-3FaIpGFQ.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-DJ_csktZ.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-CUN4s7l5.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-Bn0PR5DU.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-D83hg6XR.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-D9OXxqLB.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-CbImkeMI.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-D11Ey5VE.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-BBIV4iSw.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-B9BZvaRb.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-5s1xmBXn.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-Ct7Mn5C4.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-DL22BDsO.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-JFwBVb3D.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-DesRpNq8.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-DsrKrrxI.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen--Hx24NbF.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-BKd6EBDF.js",
    "revision": null
  }, {
    "url": "assets/SpaceAuditLog-Z56YaUM8.js",
    "revision": null
  }, {
    "url": "assets/SoulPactInteraction-DG7Wg7ZZ.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-CsnjXv_2.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-Bk7fnHL8.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-C7s-5No2.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-D_i2FztM.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-I-P7rjws.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-RWIvgDyQ.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-DJ79i_YI.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-BC1OAbCW.js",
    "revision": null
  }, {
    "url": "assets/Registration-CyKtsgoI.js",
    "revision": null
  }, {
    "url": "assets/RadianceDrilldown-dPwG-Owr.js",
    "revision": null
  }, {
    "url": "assets/ProductFormModal-CJU31uV-.js",
    "revision": null
  }, {
    "url": "assets/ProViews-Ddjq6C3I.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-By3lHXqm.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-CZzyEjqY.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-siTVxv_3.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-CtRaRzWR.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-BptCUpSz.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-CaVIcWcB.js",
    "revision": null
  }, {
    "url": "assets/PredictiveOccupancy-Da3FRHGY.js",
    "revision": null
  }, {
    "url": "assets/PortalView-FSt0QzuX.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-BNfej5oI.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-D-l_Qe5z.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-C-eDv4jR.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-BpfGaREi.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-Y2hDXncK.js",
    "revision": null
  }, {
    "url": "assets/OracleView-D_i4eP26.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-hWtbMeA_.js",
    "revision": null
  }, {
    "url": "assets/OracleCardPremium-Dai3Sdvd.js",
    "revision": null
  }, {
    "url": "assets/OfflineRetreat-CcieI_AF.js",
    "revision": null
  }, {
    "url": "assets/MicroInteraction-yrREZLZo.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-BdWkN1yb.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-2AtJV_yf.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-CCLQDyW6.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-CKRoScKc.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-DlqEMvN6.js",
    "revision": null
  }, {
    "url": "assets/HealingCircleEntry-CYkl3Yep.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-C34KVLMK.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-CHszJGT4.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-DUkxCWg7.js",
    "revision": null
  }, {
    "url": "assets/DynamicAvatar-uvnL5y5J.js",
    "revision": null
  }, {
    "url": "assets/CustomInterventionWizard-JIkuHrKt.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-D5lgAMYt.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-DVnaw6Qs.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-C3EwGYmh.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-CD_OQP8F.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-cNJdah5X.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-qdnoI5kf.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-MPvsI19z.js",
    "revision": null
  }, {
    "url": "assets/Cards-Bp7-MB-h.js",
    "revision": null
  }, {
    "url": "assets/CameraWidget-C7kUa-Kk.js",
    "revision": null
  }, {
    "url": "assets/BottomSheet-Df7q7Vv5.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-BcbnJZGg.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-CtGTjdCp.js",
    "revision": null
  }, {
    "url": "assets/Auth-B8ajrSRs.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-xLfYf9Ht.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-kJdWlC1o.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-_8zX_XTu.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-CDU3qwsF.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-BnZR_Bpg.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ee6279a921394bdeb776770e685cca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
