import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Bookmark01Icon,
  Cancel01Icon,
  Copy01Icon,
  CreditCardIcon,
  DeliveryTruck01Icon,
  FilterHorizontalIcon,
  GridIcon,
  GridViewIcon,
  Location01Icon,
  Logout01Icon,
  MailValidation01Icon,
  Menu01Icon,
  MinusSignIcon,
  Notification01Icon,
  PackageIcon,
  PackageSearchIcon,
  PlusSignIcon,
  ReturnRequestIcon,
  Search01Icon,
  ShoppingBag01Icon,
  SmartPhone01Icon,
  SquareLock02Icon,
  Tag01Icon,
  Tick02Icon,
  UserCircleIcon,
  UserIcon,
  Wallet01Icon,
  ZoomInAreaIcon,
} from "@hugeicons/core-free-icons"
import type { ComponentProps } from "react"

/**
 * App icon set: Hugeicons, free "stroke rounded" style.
 * Every icon in the app comes from here, so swapping a glyph (or the
 * whole library) is a one-file change. Size with Tailwind (`size-5`)
 * or a parent `[&_svg]:size-*`; colour follows `currentColor`.
 */
type IconData = ComponentProps<typeof HugeiconsIcon>["icon"]
export type IconProps = Omit<ComponentProps<typeof HugeiconsIcon>, "icon">

function make(icon: IconData, name: string) {
  function Icon({ strokeWidth = 1.5, ...props }: IconProps) {
    return <HugeiconsIcon icon={icon} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" {...props} />
  }
  Icon.displayName = name
  return Icon
}

export const ArrowLeft = make(ArrowLeft01Icon, "ArrowLeft")
export const ArrowRight = make(ArrowRight01Icon, "ArrowRight")
export const Bell = make(Notification01Icon, "Bell")
export const Bookmark = make(Bookmark01Icon, "Bookmark")
export const Check = make(Tick02Icon, "Check")
export const ChevronDown = make(ArrowDown01Icon, "ChevronDown")
export const ChevronRight = make(ArrowRight01Icon, "ChevronRight")
export const Copy = make(Copy01Icon, "Copy")
export const CreditCard = make(CreditCardIcon, "CreditCard")
export const Grip = make(GridIcon, "Grip")
export const LayoutGrid = make(GridViewIcon, "LayoutGrid")
export const Lock = make(SquareLock02Icon, "Lock")
export const LogOut = make(Logout01Icon, "LogOut")
export const MailCheck = make(MailValidation01Icon, "MailCheck")
export const MapPin = make(Location01Icon, "MapPin")
export const Menu = make(Menu01Icon, "Menu")
export const Minus = make(MinusSignIcon, "Minus")
export const Package = make(PackageIcon, "Package")
export const PackageSearch = make(PackageSearchIcon, "PackageSearch")
export const Plus = make(PlusSignIcon, "Plus")
export const RotateCcw = make(ReturnRequestIcon, "RotateCcw")
export const Search = make(Search01Icon, "Search")
export const ShoppingBag = make(ShoppingBag01Icon, "ShoppingBag")
export const SlidersHorizontal = make(FilterHorizontalIcon, "SlidersHorizontal")
export const Smartphone = make(SmartPhone01Icon, "Smartphone")
export const Tag = make(Tag01Icon, "Tag")
export const Truck = make(DeliveryTruck01Icon, "Truck")
export const User = make(UserIcon, "User")
export const UserRound = make(UserCircleIcon, "UserRound")
export const Wallet = make(Wallet01Icon, "Wallet")
export const X = make(Cancel01Icon, "X")
export const ZoomIn = make(ZoomInAreaIcon, "ZoomIn")
