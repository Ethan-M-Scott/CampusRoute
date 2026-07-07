"use client"
// Shared modal host that opens login and sign-up dialogs from the URL.
import LoginModal from "./LoginModal";
import SignUpModal from "./SignUpModal";
import { JSX, useCallback, useEffect, useRef } from "react";
import useSearchParamsDX from "../hooks/useSearchParamsDX";

const ModalDialog = () => {
    const [searchParams, setSearchParams] = useSearchParamsDX();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const onDialogClose = useCallback((_: Event) => setSearchParams({modal: undefined}), [setSearchParams]);

    const modals = {
        "login":    (<LoginModal  dialog={dialogRef.current} />),
        "register": (<SignUpModal dialog={dialogRef.current} />)
    } as Record<string, JSX.Element>;
    const modal = (modals[searchParams.get("modal") ?? ""]) ?? null;

    if (modal) dialogRef.current?.showModal();

    // while this only runs on mount, unfortunately changing search params counts as navigation
    useEffect(() => {
        const dialog = dialogRef.current;

        dialog?.addEventListener("close", onDialogClose);

        return () => dialog?.removeEventListener("close", onDialogClose);
    });

    return (
        <dialog ref={dialogRef} closedby="any" className="m-auto w-[calc(100vw-1rem)] max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            {modal}
        </dialog>
    );
}

export default ModalDialog;