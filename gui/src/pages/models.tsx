import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import _ from "lodash";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { defaultBorderRadius, lightGray, vscBackground } from "../components";
import ModelCard from "../components/modelSelection/ModelCard";
import { useNavigationListener } from "../hooks/useNavigationListener";
import { setDefaultModel } from "../redux/slices/stateSlice";
import { postToIde } from "../util/ide";
import { MODEL_INFO, PROVIDER_HOME, OTHER_PROVIDERS } from "../util/modelData";
import { CustomModelButton } from "./modelconfig";

const IntroDiv = styled.div`
  padding: 8px 12px;
  border-radius: ${defaultBorderRadius};
  border: 1px solid ${lightGray};
  margin: 1rem;
`;

const GridDiv = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 2rem;
  padding: 1rem;
  justify-items: center;
  align-items: center;
`;

function Models() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  useNavigationListener();

  const [showOtherProviders, setShowOtherProviders] = useState(
    location.state?.showOtherProviders ?? false
  );

  const handleOtherClick = () => setShowOtherProviders(true);

  const handleBackArrowClick = () => {
    if (location.state?.referrer) {
      navigate(location.state.referrer);
    }
    else if (showOtherProviders) {
      setShowOtherProviders(false);
    }  
    else {
      navigate("/");
    }
  };

  return (
    <div>
      <div
        className="items-center flex m-0 p-0 sticky top-0"
        style={{
          borderBottom: `0.5px solid ${lightGray}`,
          backgroundColor: vscBackground,
          zIndex: 2,
        }}
      >
        <ArrowLeftIcon
          width="1.2em"
          height="1.2em"
          onClick={handleBackArrowClick}
          className="inline-block ml-4 cursor-pointer"
        />
        <h3 className="text-lg font-bold m-2 inline-block">Add Model</h3>
      </div>
      <br />
      <IntroDiv style={{ textAlign: "center" }}>
        To add a model, select one of the options below:
      </IntroDiv>
      <GridDiv>
        {!showOtherProviders && (
          <>
            <ModelCard
              title={PROVIDER_HOME["pearaiserver"].title}
              description={PROVIDER_HOME["pearaiserver"].description}
              tags={PROVIDER_HOME["pearaiserver"].tags}
              icon={PROVIDER_HOME["pearaiserver"].icon}
              onClick={() => navigate(`/modelconfig/pearaiserver`)}
            />
            <ModelCard
              title={PROVIDER_HOME["other"].title}
              description={PROVIDER_HOME["other"].description}
              tags={PROVIDER_HOME["other"].tags}
              icon={PROVIDER_HOME["other"].icon}
              onClick={handleOtherClick}
            />
          </>
        )}
        {showOtherProviders &&
          Object.entries(OTHER_PROVIDERS).map(([name, modelInfo]) => (
            <ModelCard
              key={name}
              title={modelInfo.title}
              description={modelInfo.description}
              tags={modelInfo.tags}
              icon={modelInfo.icon}
              onClick={() => navigate(`/modelconfig/${name}`, {
                state: { referrer: location.state?.referrer }
              })}
            />
          ))}
      </GridDiv>
      <div style={{ padding: "8px" }}>
        <hr style={{ color: lightGray, border: `1px solid ${lightGray}` }} />
        <p style={{ color: lightGray }}>
          Or edit manually in config.json:
        </p>
        <CustomModelButton
          disabled={false}
          onClick={() => postToIde("openConfigJson", undefined)}
        >
          <h3 className="text-center my-2">Open config.json</h3>
        </CustomModelButton>
      </div>
    </div>
  );
}

export default Models;
