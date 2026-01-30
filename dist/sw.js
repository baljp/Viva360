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
    "revision": "8719db4a695427ceece1f868d01ea15d"
  }, {
    "url": "assets/vendor-D0JrOUql.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-BSiHECve.js",
    "revision": null
  }, {
    "url": "assets/paymentMock-D4WmpuvJ.js",
    "revision": null
  }, {
    "url": "assets/index-BIkJUPHz.js",
    "revision": null
  }, {
    "url": "assets/index-BAtWe9iT.css",
    "revision": null
  }, {
    "url": "assets/gardenService-CDsGg8mD.js",
    "revision": null
  }, {
    "url": "assets/chatMock-C-gJQrm7.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-CVTSgMpu.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-BQCWDkwt.js",
    "revision": null
  }, {
    "url": "assets/VagasList-CxDtJoXe.js",
    "revision": null
  }, {
    "url": "assets/TribeView-DTbgnV7z.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-qG-PPWtu.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-D0I49pOl.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-9JoEE-mo.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-BAsxlZwh.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-D6u3bW0u.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-DCTAKneT.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-CN_hnZwW.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-CgesTV4V.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-BsFgot3X.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-BEc8KNd8.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-Cq6q592v.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-DawlOy1V.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-DGN9ijGU.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-D-Xyq4tx.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-Cgfoe5fW.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-9NIrYSXu.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-BGiuiSu2.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-Cc_ebnKd.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-DIY5sFIK.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-BfAS_A5i.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-BS3BEOfA.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-DkQmAqOX.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-BG974H4z.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-DK4auMU2.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-Bru-G0IF.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-BCPULNXP.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-DDRX9q6y.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-Brz04LZp.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-BF5ycRCN.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-DGYLuI6Y.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-D3zTf0EV.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-DJBShyM1.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-DeyoNwgb.js",
    "revision": null
  }, {
    "url": "assets/Registration-i4GD9Xu7.js",
    "revision": null
  }, {
    "url": "assets/ProViews-CeMs1QQh.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-CbefAUrN.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-BBU6obzE.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-h4UOqTbL.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-BMkSRCtd.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-J4UxJfsp.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-BLEi38RX.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-BlaI1V6e.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen--jhhdMmY.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-KE69mmF6.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-BcgpRFWK.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-BPbw6p3o.js",
    "revision": null
  }, {
    "url": "assets/OracleView-Dadf8fc9.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-B4njIDVV.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-DPhTa-f8.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-NDIwx0mN.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-LKg4pb9Q.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-CFNMY4fJ.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-DWrj1snJ.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-sjpqG5RH.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-B9y6gjo7.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-Dny4xKnb.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-Bf8kr07G.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-BczoAlx-.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-CBQN66Do.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-Cx4bGB5r.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-DajZYvSW.js",
    "revision": null
  }, {
    "url": "assets/Checkout-DcCRrJ-J.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-BubxNy82.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-CQ3idbkA.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-GwECFQX7.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-BMnhQXG2.js",
    "revision": null
  }, {
    "url": "assets/Auth-B85SkJ_K.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-B6H3XPGI.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-rWy8U53_.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-WMoKKqCN.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-ggD4_Of_.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-Bk_ymYnK.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "596683ddeddff0f6b9a2fcf15fb415ed"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
//# sourceMappingURL=sw.js.map
