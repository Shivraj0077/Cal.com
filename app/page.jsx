'use client'

import { useRouter } from "next/navigation"

export default function Home(){
  const router = useRouter();

  const handleRedirect = () => {
    router.push("/signUp");
  }

  return (
    <div>
      <button onClick={handleRedirect}>Go to signUp</button>
    </div>
  )
}
