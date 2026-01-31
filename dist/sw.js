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
    "revision": "d054d56c0279666e7d5994814cb66a2b"
  }, {
    "url": "assets/utils-l0sNRNKZ.js",
    "revision": null
  }, {
    "url": "assets/useSoulCards-tH7iON3s.js",
    "revision": null
  }, {
    "url": "assets/ui-k9t5OULl.js",
    "revision": null
  }, {
    "url": "assets/phraseService-1V-GDPik.js",
    "revision": null
  }, {
    "url": "assets/paymentMock-D4WmpuvJ.js",
    "revision": null
  }, {
    "url": "assets/index-DQ82mYS8.css",
    "revision": null
  }, {
    "url": "assets/index-CscbBkkJ.js",
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
    "url": "assets/WalletViewScreen-DmIP6G-r.js",
    "revision": null
  }, {
    "url": "assets/VideoPrepScreen-CP1lACks.js",
    "revision": null
  }, {
    "url": "assets/VagasList-DnLMP3cU.js",
    "revision": null
  }, {
    "url": "assets/TribeView-e3M2jYEX.js",
    "revision": null
  }, {
    "url": "assets/TribeInvite-CLfiB_Nz.js",
    "revision": null
  }, {
    "url": "assets/TribeInteraction-BQl17ewQ.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseView-DGmOpT9v.js",
    "revision": null
  }, {
    "url": "assets/TimeLapseExperience-4YyezMNM.js",
    "revision": null
  }, {
    "url": "assets/SpaceViews-BLNE28MI.js",
    "revision": null
  }, {
    "url": "assets/SpaceTeam-vgbNLpV2.js",
    "revision": null
  }, {
    "url": "assets/SpaceSummon-DdR34zTg.js",
    "revision": null
  }, {
    "url": "assets/SpaceRooms-CoRbInqb.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomEdit-BWmI6mb8.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomCreate-CQzr-X22.js",
    "revision": null
  }, {
    "url": "assets/SpaceRoomAgenda-2ik4fjfa.js",
    "revision": null
  }, {
    "url": "assets/SpaceRetreatsManager-CHCU-JPM.js",
    "revision": null
  }, {
    "url": "assets/SpaceReputation-B2S-RB8R.js",
    "revision": null
  }, {
    "url": "assets/SpaceRecruitment-BsmG_ZJN.js",
    "revision": null
  }, {
    "url": "assets/SpaceProDetails-D9o70u7g.js",
    "revision": null
  }, {
    "url": "assets/SpacePatients-CFonJflh.js",
    "revision": null
  }, {
    "url": "assets/SpaceMarketplace-xXT_mQGc.js",
    "revision": null
  }, {
    "url": "assets/SpaceInvite-BKxe7TXh.js",
    "revision": null
  }, {
    "url": "assets/SpaceGovernance-BwlswcBT.js",
    "revision": null
  }, {
    "url": "assets/SpaceFinance-CtNTZWbq.js",
    "revision": null
  }, {
    "url": "assets/SpaceEventCreate-Bd-gT_Pm.js",
    "revision": null
  }, {
    "url": "assets/SpaceDashboard-gCS59BhC.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatRoomScreen-DqQh13Br.js",
    "revision": null
  }, {
    "url": "assets/SpaceChatListScreen-BOl26gG8.js",
    "revision": null
  }, {
    "url": "assets/SpaceCalendar-BXjrTFZ5.js",
    "revision": null
  }, {
    "url": "assets/SpaceAuditLog-joNIX5zo.js",
    "revision": null
  }, {
    "url": "assets/SoulPactInteraction-BbLS9Yie.js",
    "revision": null
  }, {
    "url": "assets/SoulJournalView-eCscJYQJ.js",
    "revision": null
  }, {
    "url": "assets/SoulCard-CpPwGl5o.js",
    "revision": null
  }, {
    "url": "assets/SettingsViews-DaFOuRjG.js",
    "revision": null
  }, {
    "url": "assets/ServiceViews-CYfnY8lt.js",
    "revision": null
  }, {
    "url": "assets/ServiceEvaluation-CkM6ycyB.js",
    "revision": null
  }, {
    "url": "assets/ScreenConnector-C_kfIahj.js",
    "revision": null
  }, {
    "url": "assets/RitualsView-B6r2_FJt.js",
    "revision": null
  }, {
    "url": "assets/ResetPassword-DQG1l9sn.js",
    "revision": null
  }, {
    "url": "assets/Registration-CQSF1ZUK.js",
    "revision": null
  }, {
    "url": "assets/RadianceDrilldown-DUgKQ5Fr.js",
    "revision": null
  }, {
    "url": "assets/ProViews-BWnbfeHn.js",
    "revision": null
  }, {
    "url": "assets/ProTribe-CKOLvedy.js",
    "revision": null
  }, {
    "url": "assets/ProMarketplace-BTtzWNzB.js",
    "revision": null
  }, {
    "url": "assets/ProFinance-DtIfKqaY.js",
    "revision": null
  }, {
    "url": "assets/ProDashboard-Cf-2nrrt.js",
    "revision": null
  }, {
    "url": "assets/ProChatRoomScreen-DISKzEN5.js",
    "revision": null
  }, {
    "url": "assets/ProChatListScreen-DI2R0UhK.js",
    "revision": null
  }, {
    "url": "assets/PredictiveOccupancy-CS6I_xFv.js",
    "revision": null
  }, {
    "url": "assets/PaymentSuccess-B2O88ivi.js",
    "revision": null
  }, {
    "url": "assets/PaymentHistoryScreen-WzpxZwGm.js",
    "revision": null
  }, {
    "url": "assets/PatientsList-CAasRb3k.js",
    "revision": null
  }, {
    "url": "assets/PatientProfile-D0O6CatO.js",
    "revision": null
  }, {
    "url": "assets/PatientEvolutionView-BaD4qGkW.js",
    "revision": null
  }, {
    "url": "assets/OracleView-bw-E6fKn.js",
    "revision": null
  }, {
    "url": "assets/OracleGrimoire-kT8fDoZ1.js",
    "revision": null
  }, {
    "url": "assets/OracleCardPremium-CEPiLane.js",
    "revision": null
  }, {
    "url": "assets/OfflineRetreat-DKHvKzOc.js",
    "revision": null
  }, {
    "url": "assets/MetamorphosisWizard-DCFl3sHX.js",
    "revision": null
  }, {
    "url": "assets/MarketplaceExplorer-BpjSyj_g.js",
    "revision": null
  }, {
    "url": "assets/MapaDaCuraView-Bfd1CFgg.js",
    "revision": null
  }, {
    "url": "assets/KarmaWallet-i3x4oJtx.js",
    "revision": null
  }, {
    "url": "assets/InternalGarden-BVcMnJLN.js",
    "revision": null
  }, {
    "url": "assets/HealingCircleEntry-D5LuLI5E.js",
    "revision": null
  }, {
    "url": "assets/EvolutionView-CbN3ThR3.js",
    "revision": null
  }, {
    "url": "assets/EvolutionAnalytics-Ca_NbgyX.js",
    "revision": null
  }, {
    "url": "assets/EmotionalHistory-Bd3ieJpQ.js",
    "revision": null
  }, {
    "url": "assets/CustomInterventionWizard-Dn7emSVf.js",
    "revision": null
  }, {
    "url": "assets/CollectionGrimoire-C643ddSi.js",
    "revision": null
  }, {
    "url": "assets/ClientViews-DwcFLcZU.js",
    "revision": null
  }, {
    "url": "assets/ClientMarketplace-3Kf4Ivmd.js",
    "revision": null
  }, {
    "url": "assets/ClientDashboard-CMMogXJR.js",
    "revision": null
  }, {
    "url": "assets/CheckoutScreen-DvodT9wM.js",
    "revision": null
  }, {
    "url": "assets/Checkout-BlR8UlZ6.js",
    "revision": null
  }, {
    "url": "assets/ChatRoomScreen-LGsYL7Ns.js",
    "revision": null
  }, {
    "url": "assets/ChatListScreen-BT-FcKFD.js",
    "revision": null
  }, {
    "url": "assets/BookingSelect-yNUxwt-5.js",
    "revision": null
  }, {
    "url": "assets/BookingConfirm-Bk-5efIy.js",
    "revision": null
  }, {
    "url": "assets/Auth-CHSIk38U.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaProposeTrade-D4afmgzK.js",
    "revision": null
  }, {
    "url": "assets/AlquimiaCreateOffer-CNSVw2Pn.js",
    "revision": null
  }, {
    "url": "assets/AgendaView-BGN2TucT.js",
    "revision": null
  }, {
    "url": "assets/AdminViews-g21MlQbq.js",
    "revision": null
  }, {
    "url": "assets/AchievementsView-n0VQFOeM.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "00ee6279a921394bdeb776770e685cca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
