import { Outlet } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../pages/client/home/Footer";

export default function MainLayout() {
    return (
        <>
            <Navbar />
            <main >
                <Outlet />
            </main>
            <Footer />
        </>

    );
}