"use client"

import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const handleOnClick = () => {
        router.push("/availability");
    }

    return(
        <div>
            <button onClick={handleOnClick}>Go to availability</button>
        </div>
    )
}