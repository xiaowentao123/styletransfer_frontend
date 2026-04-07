import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./shared/RootLayout";
import { HomePage } from "./pages/HomePage";
import { TransferPage } from "./pages/TransferPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { SwitchUserPage } from "./pages/SwitchUserPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "transfer", element: <TransferPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "switch-user", element: <SwitchUserPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
]);
