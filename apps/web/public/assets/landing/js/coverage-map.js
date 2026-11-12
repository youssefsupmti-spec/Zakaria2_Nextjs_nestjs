/*
 * coverage-map.js — Carte Leaflet « Couverture Nationale » (landing G4D).
 * Composant Alpine `coverageMap` : affiche les hubs du réseau national sur
 * une carte du Maroc. Aucune coordonnée n'est stockée en base — les villes
 * principales (hubs régionaux) sont déclarées ici.
 */
(function () {
    'use strict';

    // Styles des marqueurs injectés une seule fois (évite la dépendance à un build CSS).
    function injectStyles() {
        if (document.getElementById('g4d-coverage-map-styles')) {
            return;
        }
        var css = ''
            + '.g4d-map-marker{background:transparent;border:0}'
            + '.g4d-map-dot{display:block;width:14px;height:14px;border-radius:50%;'
            + 'background:var(--c,#2996C8);border:3px solid #fff;'
            + 'box-shadow:0 0 0 2px var(--c,#2996C8),0 2px 6px rgba(0,0,0,.25)}'
            + '.g4d-map-dot--hub{width:18px;height:18px;background:var(--g4d-orange,#F47B20);'
            + 'box-shadow:0 0 0 2px var(--g4d-orange,#F47B20),0 2px 8px rgba(0,0,0,.3)}'
            + '.leaflet-container{font-family:inherit;background:#eaf2f7}'
            + '.leaflet-tooltip.g4d-map-tip{background:#0B3D5C;color:#fff;border:0;'
            + 'border-radius:6px;font-weight:600;font-size:12px;padding:3px 8px;box-shadow:0 2px 8px rgba(0,0,0,.2)}'
            + '.leaflet-tooltip.g4d-map-tip::before{border-top-color:#0B3D5C}';
        var style = document.createElement('style');
        style.id = 'g4d-coverage-map-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Hubs principaux du réseau national (lat, lng). « hub: true » = ville-relais majeure.
    var HUBS = [
        { name: 'Tanger',      lat: 35.7595, lng: -5.8340, hub: true },
        { name: 'Tétouan',     lat: 35.5785, lng: -5.3684 },
        { name: 'Al Hoceïma',  lat: 35.2517, lng: -3.9372 },
        { name: 'Oujda',       lat: 34.6814, lng: -1.9086, hub: true },
        { name: 'Fès',         lat: 34.0331, lng: -5.0003, hub: true },
        { name: 'Meknès',      lat: 33.8935, lng: -5.5473 },
        { name: 'Kénitra',     lat: 34.2610, lng: -6.5802 },
        { name: 'Rabat',       lat: 34.0209, lng: -6.8416, hub: true },
        { name: 'Casablanca',  lat: 33.5731, lng: -7.5898, hub: true },
        { name: 'El Jadida',   lat: 33.2316, lng: -8.5007 },
        { name: 'Settat',      lat: 33.0010, lng: -7.6160 },
        { name: 'Béni Mellal', lat: 32.3373, lng: -6.3498 },
        { name: 'Marrakech',   lat: 31.6295, lng: -7.9811, hub: true },
        { name: 'Safi',        lat: 32.2994, lng: -9.2372 },
        { name: 'Essaouira',   lat: 31.5085, lng: -9.7595 },
        { name: 'Agadir',      lat: 30.4278, lng: -9.5981, hub: true },
        { name: 'Ouarzazate',  lat: 30.9335, lng: -6.9370 },
        { name: 'Errachidia',  lat: 31.9314, lng: -4.4244 },
        { name: 'Laâyoune',    lat: 27.1253, lng: -13.1625 },
        { name: 'Dakhla',      lat: 23.6848, lng: -15.9579 },
    ];

    function g4dRegisterCoverageMap() {
        window.Alpine.data('coverageMap', function () {
            return {
                map: null,
                mapReady: false,

                init: function () {
                    if (typeof L === 'undefined' || !this.$refs.mapEl) {
                        return;
                    }
                    injectStyles();

                    var self = this;

                    this.map = L.map(this.$refs.mapEl, {
                        center: [29.5, -8.5],
                        zoom: 5,
                        scrollWheelZoom: false,
                        zoomControl: true,
                        attributionControl: false,
                    });

                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                        maxZoom: 19,
                        subdomains: 'abcd',
                    }).addTo(this.map);

                    var bounds = [];
                    HUBS.forEach(function (h) {
                        var icon = L.divIcon({
                            className: 'g4d-map-marker',
                            html: '<span class="g4d-map-dot' + (h.hub ? ' g4d-map-dot--hub' : '') + '"></span>',
                            iconSize: h.hub ? [18, 18] : [14, 14],
                            iconAnchor: h.hub ? [9, 9] : [7, 7],
                        });
                        L.marker([h.lat, h.lng], { icon: icon })
                            .addTo(self.map)
                            .bindTooltip(h.name, {
                                direction: 'top',
                                offset: [0, -8],
                                className: 'g4d-map-tip',
                            });
                        bounds.push([h.lat, h.lng]);
                    });

                    if (bounds.length) {
                        this.map.fitBounds(bounds, { padding: [28, 28] });
                    }

                    // Leaflet a besoin d'un recalcul de taille après le rendu Alpine/AOS.
                    this.$nextTick(function () {
                        self.map.invalidateSize();
                        self.mapReady = true;
                    });
                    setTimeout(function () {
                        if (self.map) { self.map.invalidateSize(); }
                    }, 450);
                },
            };
        });
    }

    // Enregistrement robuste : avec la navigation SPA de Livewire (wire:navigate),
    // l'évènement « alpine:init » ne se redéclenche pas sur les pages suivantes.
    // Si Alpine est déjà présent, on définit le composant immédiatement ; sinon on
    // attend l'initialisation. Évite « coverageMap is not defined ».
    if (window.Alpine) {
        g4dRegisterCoverageMap();
    } else {
        document.addEventListener('alpine:init', g4dRegisterCoverageMap);
    }
})();
