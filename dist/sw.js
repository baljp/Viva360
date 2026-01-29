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
    "revision": "b9216744a8a97baa99be9119fa0e1ff3"
  }, {
    "url": "assets/vendor-iWP1S4Xh.js",
    "revision": null
  }, {
    "url": "assets/paymentMock-D4WmpuvJ.js",
    "revision": null
  }, {
    "url": "assets/index-B_6RE10G.js",
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
    "url": "assets/WalletViewScreen-DeLQCWw-.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-C_55wOUH.js",
    "revision": null
  }, {
    "url": "assets/VagasList-Yu-Y1neD.js",
    "revision": null
  }, {
    "url": "assets/TribeView-CBC953n3.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-BxbF9cqq.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-02p_bidp.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-n5AzZ_13.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-YWPbzSfN.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-Cv1qNvNC.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-lHl6emC7.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-Cxvxdi9O.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-C66uislR.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-Cn1ntOa7.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-CdFpcpO-.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-CE5ISs8p.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-Ds5St5bQ.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-CAGSWOPd.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-DEISOYLV.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-BHwT5-PH.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-Czi7Aszf.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-DTTiCZ9_.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-DBbhgGjw.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-DDxdcexA.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-CWTdDiCh.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-B1tTO9LV.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-Cu0QoqC7.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-C0gazRRO.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-Br1tZzj4.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-CyNjQfuX.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-auXX02RT.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-BlYOUEv6.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-C5X2PAGz.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-CQ6eQ5Sa.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-CckLHQ9M.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-BkZIC6kQ.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-DkC2QtJS.js",
    "revision": null
  }, {
    "url": "assets/Registration-HVMU8Oqz.js",
    "revision": null
  }, {
    "url": "assets/ProViews-DGUCQ0fr.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-sYA9TA9S.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-CBTL3aP-.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-3ZVCh1Cd.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-4Ww6pzmf.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-Dv2-Qk14.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-Cxmc4AkT.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-3dqqZw2F.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-CSXqqPT_.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-BHXKdCN9.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-KHh6xnst.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-C8b7TA79.js",
    "revision": null
  }, {
    "url": "assets/OracleView-B40-yIjM.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-BrYG8e7a.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-CxNDzHXA.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-SkekwrFL.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-Bs5l3Lm-.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-DfaohJh-.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-CB4sDPV2.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-D_QDGudg.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-roYMa5Sl.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-CJQzyYY1.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-HL_VKEqs.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-DAE4iXQd.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-CnttRf5Y.js",
    "revision": null
  }, {
    "url": "assets/Checkout-Bv4_KV6B.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-Cuy5YyF1.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-PBhvLWQq.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-PHMNW4i5.js",
    "revision": null
  }, {
    "url": "assets/BookingSearch-B3nbAKkc.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-D4s0rkAU.js",
    "revision": null
  }, {
    "url": "assets/Auth-DVkYr8T3.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-BBRFlvkZ.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-uSNeOU7S.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-iryLwqJ8.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-Cs_ceKgy.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-CFxLpjdn.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "596683ddeddff0f6b9a2fcf15fb415ed"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
//# sourceMappingURL=sw.js.map
