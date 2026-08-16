"use client";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import type { LatLngExpression } from "leaflet";

type RoutePoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type LiveRouteMapProps = {
  route: RoutePoint[];
};

function MapFollower({
  position,
}: {
  position: RoutePoint;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(
      [
        position.latitude,
        position.longitude,
      ],
      Math.max(map.getZoom(), 16),
      {
        animate: true,
      }
    );
  }, [
    map,
    position.latitude,
    position.longitude,
  ]);

  return null;
}

export default function LiveRouteMap({
  route,
}: LiveRouteMapProps) {
  if (route.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#eef0f2]">
        <div className="text-center text-gray-400">
          <p className="text-sm font-medium">
            Waiting for GPS
          </p>

          <p className="mt-1 text-xs">
            Your route will appear here
          </p>
        </div>
      </div>
    );
  }

  const currentPosition =
    route[route.length - 1];

  const center: LatLngExpression = [
    currentPosition.latitude,
    currentPosition.longitude,
  ];

  const routeCoordinates: LatLngExpression[] =
    route.map((point) => [
      point.latitude,
      point.longitude,
    ]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={routeCoordinates}
          pathOptions={{
            color: "#111318",
            weight: 5,
            opacity: 0.9,
          }}
        />

        <CircleMarker
          center={center}
          radius={9}
          pathOptions={{
            color: "#111318",
            weight: 4,
            fillColor: "#c7ff3d",
            fillOpacity: 1,
          }}
        />

        <MapFollower
          position={currentPosition}
        />
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium shadow-sm">
        ● Live
      </div>
    </div>
  );
}