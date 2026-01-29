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
    "revision": "fac6636b242bb86939be827a470f8999"
  }, {
    "url": "assets/vendor-BebpraSK.js",
    "revision": null
  }, {
    "url": "assets/paymentMock-D4WmpuvJ.js",
    "revision": null
  }, {
    "url": "assets/index-DnxihOCU.js",
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
    "url": "assets/WalletViewScreen-CP_X0B71.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-C-eEuIg-.js",
    "revision": null
  }, {
    "url": "assets/VagasList-BKLAqBDn.js",
    "revision": null
  }, {
    "url": "assets/TribeView-CfAQe3zp.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-CY7BUCDh.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-DEXQ9CWf.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-mr3lrq_j.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-DqPEc_bD.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-D8NfJ9S5.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-CasOj9DO.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-9uuOLWBs.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-Cap8AbO4.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-DzGmoRnP.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-92qTgy5z.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-BztLW3HZ.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-C3z6aGek.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-F1VsyuOq.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-Ni95qZqk.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-iHbV-4im.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-CsoMJkQ8.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-EkP4hLmu.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-Du-xjeEx.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-DDV9CF3s.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-D7FL7wmt.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-CxglxP9X.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-Cq_smEFo.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-CVPt68F5.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-DYz6n5cx.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-CgeRBZO3.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-ByfjwiIJ.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-BH6YgwJz.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-BofriizQ.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-D92Ku5Ln.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-ChwfCVpY.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-DONWm0wr.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-BQO3QLvf.js",
    "revision": null
  }, {
    "url": "assets/Registration-D6oKNo65.js",
    "revision": null
  }, {
    "url": "assets/ProViews-rODZCcNG.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-cRRGcaVi.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-CMAn54et.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-Cvj5Dijb.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-DTwmQdx1.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-BSDEEPCh.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-BsdGa80j.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-BiKIfQfV.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-CZ6u0CU4.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-aF5q4mDm.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-CYiIvpOw.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-Bifcl7Hk.js",
    "revision": null
  }, {
    "url": "assets/OracleView-a88pYkok.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-C3UTAfYH.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-76x9QX4O.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-Cl-7ZkZi.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-C5t_fv6n.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-DqrFUbft.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-Dv4jAh49.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-lQ0kbV2e.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-Ck_4Uf-Q.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-D-lnbozy.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-BhE1wS1A.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-CANiFSV9.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-OI-ghhrX.js",
    "revision": null
  }, {
    "url": "assets/Checkout-vsrqiHBE.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-0FWYei_k.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-DSeTMbm9.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-BxUWXKMP.js",
    "revision": null
  }, {
    "url": "assets/BookingSearch-DxVtY-hi.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-BcBnWMvV.js",
    "revision": null
  }, {
    "url": "assets/Auth-6PA_reWN.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-CIVSUIZU.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-yCgePIFu.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-CYB6MCBP.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-PMnamoBu.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-CYlWCgOy.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "596683ddeddff0f6b9a2fcf15fb415ed"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
//# sourceMappingURL=sw.js.map
