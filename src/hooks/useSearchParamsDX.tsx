"use client"
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from "next/navigation";

// note: as a hook, this may ONLY BE CALLED DURING RENDERING!!! make sure to store setSearchParams at top-level. if you
// plan to use it for an event handler instead of calling useSearchParamsDX within the handler itself. ask me how I know.
export default function useSearchParamsDX(): [ReadonlyURLSearchParams, (updates: Record<string, string | undefined>) => void] {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const setSearchParams = (updates: Record<string, string | undefined>) => {
        const updatedParams = new URLSearchParams(searchParams);
        for (let [name, value] of Object.entries(updates)) {
            if (value !== undefined) updatedParams.set(name, value);
            else updatedParams.delete(name);
        }
        const searchString = updatedParams.toString();
        router.push(pathname + (searchString ? `?${searchString}` : ""));
    };

    return [searchParams, setSearchParams];
};