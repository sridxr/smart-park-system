import { useNavigate } from "react-router-dom";

import AppShell from "../../components/layout/AppShell";
import PaymentModal from "../../components/PaymentModal";
import FloatingParkingFab from "../../components/user/FloatingParkingFab";
import OnboardingModal from "../../components/ui/OnboardingModal";
import { useAuth } from "../../context/AuthContext";
import { useUserWorkspace } from "../../hooks/useUserWorkspace";

function UserWorkspace() {
  const workspace = useUserWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <AppShell role="user" context={workspace} />
      <FloatingParkingFab
        onExplore={() => {
          navigate("/user/explore");
        }}
        onNearMe={() => {
          if (!navigator.geolocation) {
            navigate("/user/explore");
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              workspace.setLocation((current) => ({
                ...current,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                fullText: "Near me",
              }));
              navigate("/user/explore");
            },
            () => navigate("/user/explore")
          );
        }}
        onSmartMode={workspace.activateSmartParkingMode}
      />
      <PaymentModal
        isOpen={Boolean(workspace.selectedParking)}
        parking={workspace.selectedParking}
        userEmail={user?.email}
        status={workspace.checkoutState}
        error={workspace.message}
        bookingWindow={workspace.bookingWindow}
        availabilityPreview={workspace.availabilityPreview}
        reservationExpiresAt={workspace.reservationExpiresAt}
        checkoutSummary={workspace.checkoutSummary}
        vehicles={workspace.vehicles}
        selectedVehicleId={workspace.selectedVehicleId}
        selectedVehicle={workspace.selectedVehicle}
        onVehicleChange={workspace.setSelectedVehicleId}
        onBookingWindowChange={workspace.updateBookingWindow}
        onClose={workspace.closeCheckout}
        onConfirm={workspace.confirmCheckout}
      />
      <OnboardingModal
        isOpen={workspace.onboardingOpen}
        onSkip={workspace.completeOnboarding}
        onComplete={workspace.completeOnboarding}
      />
    </>
  );
}

export default UserWorkspace;
