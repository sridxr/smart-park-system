import { Heart } from "lucide-react";
import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";

import ParkingCard from "../../components/ParkingCard";

function UserFavoritesPage() {
  const workspace = useOutletContext();
  const favorites = useMemo(
    () => workspace.parkings.filter((parking) => workspace.favoriteIds.includes(parking._id)),
    [workspace.favoriteIds, workspace.parkings]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <Heart className="text-emerald-200" />
          <div>
            <h3 className="text-2xl font-semibold text-white">Favorites</h3>
            <p className="text-sm text-white/55">Saved parkings and personal shortlist</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {favorites.map((parking) => (
          <ParkingCard
            key={parking._id}
            parking={parking}
            bookingId={workspace.bookingId}
            isFavorite
            onFavorite={() => workspace.handleFavorite(parking._id)}
            onBook={() => workspace.openCheckout(parking)}
          />
        ))}
      </div>
      {!favorites.length ? (
        <div className="app-empty-state rounded-[30px] p-6 text-sm">
          No favorites yet. Save parkings from Explore to build your shortlist.
        </div>
      ) : null}
    </div>
  );
}

export default UserFavoritesPage;
