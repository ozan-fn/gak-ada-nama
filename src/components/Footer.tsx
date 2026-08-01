import type React from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import { InstagramIcon } from "./ui/instagram-icon";
import { LinkedinIcon } from "./ui/linkedin-icon";
import { Link } from "@tanstack/react-router";

type FooterLink = {
	title: string;
	href: string;
	icon?: ReactNode;
};
type FooterLinkGroup = {
	label: string;
	links: FooterLink[];
};

export function StickyFooter() {
	return (
		<footer
			className="relative h-(--footer-height) w-full border-t border-neutral-800 bg-neutral-900 [--footer-height:380px]"
			style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
		>
			<div className="fixed bottom-0 h-(--footer-height) w-full bg-neutral-900 z-20">
				<div className="sticky top-[calc(100vh-var(--footer-height))] h-full overflow-y-auto">
					<div className="relative mx-auto flex size-full max-w-6xl flex-col justify-between gap-5">
						<div className="grid grid-cols-1 gap-8 px-4 pt-12 md:grid-cols-2 lg:grid-cols-4">
							<AnimatedContainer className="w-full space-y-4">
								<h2 className="text-xl font-semibold text-white">Prita.</h2>
								<p className="mt-8 text-gray-300 text-sm md:mt-0">
									Platform monitoring lingkungan berbasis AI untuk komunitas yang lebih aman.
								</p>
								<div className="flex gap-2">
									{socialLinks.map((link) => (
										<Button
											key={link.title}
											size="icon-sm"
											variant="outline"
											className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 hover:border-gray-600"
										>
											<a href={link.href}>{link.icon}</a>
										</Button>
									))}
								</div>
							</AnimatedContainer>
							{footerLinkGroups.map((group, index) => (
								<AnimatedContainer
									className="w-full"
									delay={0.1 + index * 0.1}
									key={group.label}
								>
									<div className="mb-10 md:mb-0">
										<h3 className="text-sm font-semibold text-white">{group.label}</h3>
										<ul className="mt-4 space-y-2 text-gray-300 text-sm md:text-xs lg:text-sm">
										{group.links.map((link) => (
                      <li key={link.title}>
                        <Link
                          className="inline-flex items-center hover:text-white transition-colors [&_svg]:me-1 [&_svg]:size-4"
                          to={link.href}
                        >
                          {link.icon}
                          {link.title}
                        </Link>
                      </li>
                    ))}
										</ul>
									</div>
								</AnimatedContainer>
							))}
						</div>
						<div className="flex flex-col items-center justify-between gap-2 border-t border-neutral-800 p-4 text-gray-300 text-sm md:flex-row">
							<p>
								&copy; {new Date().getFullYear()} Prita All rights reserved.
							</p>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}

const socialLinks = [
	{
		title: "Instagram",
		href: "#",
		icon: <InstagramIcon />,
	},
	{
		title: "LinkedIn",
		href: "#",
		icon: <LinkedinIcon />,
	},
];

const footerLinkGroups: FooterLinkGroup[] = [
	{
		label: "Produk",
		links: [
			{ title: "Deteksi Lingkungan", href: "#" },
			{ title: "Peta Risiko", href: "#" },
			{ title: "Pelaporan Komunitas", href: "#" },
			{ title: "Simulasi Dampak", href: "#" },
			{ title: "API untuk Developer", href: "#" },
		],
	},
	{
		label: "Sumber Daya",
		links: [
			{ title: "Blog", href: "#" },
			{ title: "Dokumentasi", href: "#" },
			{ title: "Panduan Pengguna", href: "#" },
			{ title: "Studi Kasus", href: "#" },
			{ title: "Forum Komunitas", href: "#" },
		],
	},
	{
		label: "Perusahaan",
		links: [
			{ title: "Tentang Kami", href: "#" },
			{ title: "Karir", href: "#" },
			{ title: "Kontak", href: "#" },
			{ title: "Kebijakan Privasi", href: "#" },
			{ title: "Syarat Layanan", href: "#" },
		],
	},
];

type AnimatedContainerProps = React.ComponentProps<typeof motion.div> & {
	children?: React.ReactNode;
	delay?: number;
};

function AnimatedContainer({
	delay = 0.1,
	children,
	...props
}: AnimatedContainerProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return children;
	}

	return (
		<motion.div
			initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
			transition={{ delay, duration: 0.8 }}
			viewport={{ once: true }}
			whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
			{...props}
		>
			{children}
		</motion.div>
	);
}
