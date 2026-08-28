import { createContext, useContext, useState, type ReactNode } from "react";

type EcoLensLocationContextType = {
	location: string;
	setLocation: (value: string) => void;
	coordinates: { latitude: number; longitude: number } | null;
	setCoordinates: (coords: { latitude: number; longitude: number } | null) => void;
};

const EcoLensLocationContext = createContext<EcoLensLocationContextType | null>(
	null,
);

export function EcoLensLocationProvider({ children }: { children: ReactNode }) {
	const [location, setLocation] = useState("");
	const [coordinates, setCoordinates] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	return (
		<EcoLensLocationContext.Provider
			value={{ location, setLocation, coordinates, setCoordinates }}
		>
			{children}
		</EcoLensLocationContext.Provider>
	);
}

export function useEcoLensLocationContext() {
	const context = useContext(EcoLensLocationContext);
	if (!context) {
		throw new Error(
			"useEcoLensLocationContext must be used within EcoLensLocationProvider",
		);
	}
	return context;
}

// Safe hook that returns null if provider not available
export function useEcoLensLocationContextSafe() {
	return useContext(EcoLensLocationContext);
}
