import { Suspense, useState, useTransition } from "react";
import Layout from "./Layout.tsx";
import { Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <Suspense fallback={<BigSpinner />}>
      <Layout isPending={true}>
        <Routes>
          <Route path="/" element={<div>this is 3d project</div>} />
        </Routes>
      </Layout>
    </Suspense>
  );
}

function BigSpinner() {
  return <h2>🌀 Loading...</h2>;
}
