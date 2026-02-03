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
    "revision": "d7d48ab1c764f116b5fa9e5c60fad01d"
  }, {
    "url": "assets/utils-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-tH7iON3s.js",
    "revision": null
  }, {
    "url": "assets/ui-BX_DENvw.js",
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
    "url": "assets/index-qrAUmKdc.js",
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
    "url": "assets/constants-BvHIlypo.js",
    "revision": null
  }, {
    "url": "assets/ZenSkeleton-zbhmC6kd.js",
    "revision": null
  }, {
    "url": "assets/WalletViewScreen-krRaxcjj.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-CHkHtzTU.js",
    "revision": null
  }, {
    "url": "assets/VagasList-BmKwyaUD.js",
    "revision": null
  }, {
    "url": "assets/TribeView-D2f0do28.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-Bk60ihNR.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-DY7MU0BH.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-D46ZKQOw.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-BjVcOeA5.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-BgxoPQBw.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-C5szL-Oi.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-TEnXaosX.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-BQ8pKKxj.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-DAxqSGZY.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-Cj9ttw8I.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-sEamFja9.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-ARX-19iJ.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-GqtMkFlt.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-DhiKEIUZ.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-B-bMet68.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-CkqFvKNe.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-oLiz6UV3.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-D5rgp2Y5.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-B8YfY4KS.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-DuNEGX6W.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-nUCoUSDa.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-DHehn1-v.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-CNMcV6EA.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-Dsv7rqN1.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-D4nqMIjy.js",
    "revision": null
  }, {
    "url": "assets/SpaceAuditLog-CxZrxt1z.js",
    "revision": null
  }, {
    "url": "assets/SoulPactInteraction-Koe1W0pH.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-DfZ3ZcFC.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-5oJEG7eL.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-BHlsD6I7.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-D3s2dgOp.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-CkFUX6ct.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-B1QzPP1o.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-CqeYpbsh.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-DUXOtiBT.js",
    "revision": null
  }, {
    "url": "assets/Registration-CvMraS-F.js",
    "revision": null
  }, {
    "url": "assets/RadianceDrilldown-DRY50NuT.js",
    "revision": null
  }, {
    "url": "assets/ProductFormModal-BjCvPRjK.js",
    "revision": null
  }, {
    "url": "assets/ProViews-CVSHNOwK.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-eDmmx1k-.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-CuKU31Hn.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-DyhPKB2Y.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-CKjbeuFP.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-d-ICpZpZ.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-2byT4stB.js",
    "revision": null
  }, {
    "url": "assets/PredictiveOccupancy-DrMH7D52.js",
    "revision": null
  }, {
    "url": "assets/PortalView-BQcT-AOO.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-0l3Nj9FX.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-BoVwms9n.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-HzMBiCAE.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-xfQZivaC.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-CtMzseXt.js",
    "revision": null
  }, {
    "url": "assets/OracleView-DW95Yqz3.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-COwaOg5-.js",
    "revision": null
  }, {
    "url": "assets/OracleCardPremium-CK3DCoTy.js",
    "revision": null
  }, {
    "url": "assets/OfflineRetreat-B2jkDFVz.js",
    "revision": null
  }, {
    "url": "assets/MicroInteraction-DQMCuNhF.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-ByDh0B1y.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-DUtwL2xY.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-Dx4Gqtil.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-DP-za5oD.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-CjYXjh5T.js",
    "revision": null
  }, {
    "url": "assets/HealingCircleEntry-BTRW6nZ4.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-BP8DrS4u.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-xcttOCoo.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-DvTbzx8v.js",
    "revision": null
  }, {
    "url": "assets/DynamicAvatar-D8G9U2_Q.js",
    "revision": null
  }, {
    "url": "assets/CustomInterventionWizard-CCXKjWMP.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-BsjtvM_h.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-DFe3-uL0.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-CxE9FgHD.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-DiiMtiBB.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-CsG2Up1c.js",
    "revision": null
  }, {
    "url": "assets/Checkout-B-i0xs5P.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-B0nxim6d.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-CRtXR63E.js",
    "revision": null
  }, {
    "url": "assets/Cards-DWTWMM5o.js",
    "revision": null
  }, {
    "url": "assets/CameraWidget-B2FHa_4X.js",
    "revision": null
  }, {
    "url": "assets/BottomSheet-B4sMGJym.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-D3XnHd1q.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-B3zt61uJ.js",
    "revision": null
  }, {
    "url": "assets/Auth-D4-bsaVS.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-BZUS0fvz.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-BsyrswWW.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-BRV7xvkD.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-BI7VKNp5.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-CSiHazIG.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ee6279a921394bdeb776770e685cca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
