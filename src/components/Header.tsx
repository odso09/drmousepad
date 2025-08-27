import { Link, NavLink } from "react-router-dom";
import { CartSimpleIcon } from "@/components/ui/cart-simple-icon";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import logo from '../assets/logo.png';

export const Header = () => {
  const { count } = useCart();
  return (
<header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border p-[15px]">

      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
					<div className="flex items-center gap-4">
						<img src={logo} alt="Dr Mousepad" className="h-24" />
						<div>
							<div className="text-2xl lg:text-3xl font-extrabold tracking-wide text-neon">Dr Mousepad</div>
						</div>
					</div>
        </Link>
  <nav className="flex items-center gap-10">
          <NavLink to="/" className={({ isActive }) => isActive ? "text-primary text-base md:text-lg" : "text-foreground/80 hover:text-foreground text-base md:text-lg"}>Inicio</NavLink>
          <NavLink to="/personalizar" className={({ isActive }) => isActive ? "text-primary text-base md:text-lg" : "text-foreground/80 hover:text-foreground text-base md:text-lg"}>Personalizar</NavLink>
          <Button asChild variant="secondary" className="relative !bg-[linear-gradient(135deg,#0a2236_0%,#1a2636_60%,#232b36_100%)] !border-none">
            <Link to="/carrito" aria-label="Abrir carrito">
              <CartSimpleIcon className="h-6 w-6" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground rounded-full h-5 min-w-5 px-1 grid place-items-center">
                  {count}
                </span>
              )}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
