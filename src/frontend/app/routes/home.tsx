import type { Route } from "./+types/home";
import {Welcome} from "~/components/welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Eloball" },
  ];
}

export default function Home() {
  return <Welcome />;
}
