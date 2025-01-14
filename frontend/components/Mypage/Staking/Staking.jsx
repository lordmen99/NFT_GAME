import axios from "axios";
import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import ChoiceNft from "./ChoiceNft";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tooltip,
  useDisclosure,
  Box,
  Flex,
  Text,
  Button,
  Img,
} from "@chakra-ui/react";

import { Separator } from "../../Separator/Separator";
import { useDispatch } from "react-redux";
import { regMainNft } from "../../../redux/blockchain/blockchainActions";
import BlankComponent from "../../utils/BlankComponent";
import RewardHistory from "./RewardHistory";

const Staking = ({ getCurrentMainNft, currentMainNftImg, as, slideIn }) => {
  const dispatch = useDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const blockchain = useSelector((state) => state.blockchain);
  const {
    account,
    auth,
    nftContract,
    stakingContract,
    mainNftData,
    gameTokenContract,
  } = blockchain;
  const [accessToken, setAccessToken] = useState("");
  const [currentMainNft, setcurrentMainNft] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [nftGrade, setNftGrade] = useState("");
  const [stakingContractAmount, setStakingContractAmount] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [grade, setGrade] = useState("");
  const [reward, setReward] = useState("");
  const [stakingEvents, setStakingEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const { NEXT_PUBLIC_LOGIN_KEY } = process.env;

  const baseUri = "https://gateway.pinata.cloud/ipfs/";
  const { NEXT_PUBLIC_SERVER_URL } = process.env;

  useEffect(async () => {
    const getToken = Cookies.get(NEXT_PUBLIC_LOGIN_KEY);
    const parsedToken = getToken && JSON.parse(getToken).accessToken;
    setAccessToken(parsedToken);
    if (!accessToken) return;

    const {
      payload: { id },
    } = jwtDecode(accessToken);

    await fetch(`${NEXT_PUBLIC_SERVER_URL}/users/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((result) => {
        setcurrentMainNft(result.mainNft);
      })
      .catch(window.alert);
    getMyNfts();
  }, [account, accessToken, currentMainNft, currentImage, currentMainNftImg]);
  useEffect(async () => {
    if (!(account && auth && gameTokenContract && stakingContract)) return;

    await getRemainingTokens();
  }, [gameTokenContract]);

  const getMyNfts = async () => {
    try {
      getCurrentMainNft(currentMainNft);
      const stakingData = await stakingContract.methods
        .getStakingData()
        .call({ from: account });
      const directoryUri = await nftContract.methods
        .tokenURI(stakingData.tokenId)
        .call();
      const response = await axios.get(
        `${baseUri}${directoryUri.slice(6)}/${stakingData.tokenId}.json`
      );
      setCurrentImage(`${baseUri}${response.data.image.slice(6)}`);
      setNftGrade(response.data.grade);
    } catch (error) {
      console.error();
    }
  };

  /* 스테이킹 컨트랙트에 남은 토큰 수량 불러오기 */
  const getRemainingTokens = async () => {
    const tokenAmount = await gameTokenContract.methods
      .balanceOf(stakingContract._address)
      .call();
    setStakingContractAmount(tokenAmount);
  };

  /* 스테이킹 끝내기 */
  const unStaking = async () => {
    try {
      setLoading(true);
      console.log(loading);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const endTimestamp = parseInt(mainNftData.stakingData.endTime);

      if (endTimestamp > currentTimestamp) {
        alert(
          `아직 스테이킹 기간이 종료되지 않았습니다\n테스트용으로 무시하고 계속 진행합니다`
        );

        // return;
      }
      const currentStakingNftData = await stakingContract.methods
        .getStakingData()
        .call({ from: account });

      if (
        !(
          currentStakingNftData.tokenId > 0 &&
          currentStakingNftData.tokenId <= 100
        )
      ) {
        alert("스테이킹 된 NFT가 없습니다");
        return;
      }
      if (Number(stakingContractAmount) < Number(reward)) {
        alert("스테이킹 컨트랙트에 잔액이 모자랍니다");
        return;
      }
      const unStaking = await stakingContract.methods
        .exit(currentStakingNftData.tokenId)
        .send({ from: account })
        .catch((err) => console.log(err));

      // 스테이킹 정상적으로 해지 됐으면 대표 NFT의 상태와
      // 이벤트 상태 업데이트 해주기
      if (unStaking) {
        dispatch(regMainNft({ mainNftData: null }));
        getStakingEvents();
        alert("언스테이킹 되었습니다.");
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  useEffect(async () => {
    if (!(account && auth && gameTokenContract && stakingContract)) return;
    getStakingEvents();
  }, []);

  const getStakingEvents = async () => {
    const stakingData = await stakingContract.getPastEvents("RewardEvent", {
      fromBlock: 0,
      toBlock: "latest",
      filter: { account: account },
    });
    if (stakingData.length == 0) return;
    setStakingEvents(stakingData);
  };

  /* 타임스탬프 => 날짜 변환기 */
  const dateConverter = (date) => {
    const temp = new Date(parseInt(date) * 1000);
    const tempMonth = ("0" + (temp.getMonth() + 1).toString()).slice(-2);
    const tempDate = ("0" + temp.getDate().toString()).slice(-2);
    const tempHours = ("0" + temp.getHours().toString()).slice(-2);
    const tempMinutes = ("0" + temp.getMinutes().toString()).slice(-2);
    const resultDate = `${tempMonth}/${tempDate}  ${tempHours}:${tempMinutes}`;
    return resultDate;
  };

  useEffect(async () => {
    if (!mainNftData) return;
    const tempStartTime = dateConverter(mainNftData.stakingData.startTime);
    const tempEndTime = dateConverter(mainNftData.stakingData.endTime);
    setStartTime(tempStartTime);
    setEndTime(tempEndTime);
    setGrade(mainNftData.mainNftJson.grade.toUpperCase());
    setReward(mainNftData.stakingData.reward);
  }, [mainNftData]);

  return (
    <Box
      as={as}
      animation={slideIn}
      minH={"300px"}
      backgoundColor={`var(--chakra-colors-${
        mainNftData && mainNftData.mainNftJson.grade
      }-700)`}
    >
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius={"15px"}>
          <ModalHeader>Account</ModalHeader>
          <Separator />
          <ModalCloseButton />
          <ModalBody>
            <ChoiceNft
              dateConverter={dateConverter}
              onClose={onClose}
              getCurrentMainNft={getCurrentMainNft}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* <div className="nft-block-title">
        MAIN NFT
        <Tooltip hasArrow label="대표 NFT를 설정하시면, 1 주일간 유지됩니다.">
          <i className="bx bx-help-circle"></i>
        </Tooltip>
      </div> */}
      <Flex flexDirection="column" textAlign={"center"}>
        <Box m={"20px 0"}>
          <Text fontSize={"1.5rem"} color={"gray.400"} fontWeight="bold">
            Remaining Reward Tokens : {stakingContractAmount}
          </Text>
          <Text>
            스테이킹 기간과 NFT의 등급에 따라 보상토큰을 받으실 수 있습니다
          </Text>
        </Box>
        <Flex m={"20px 0"} direction="column" align="center" justify="center">
          {mainNftData ? (
            <Flex align="center" justify="center" direction="column">
              <Text fontSize="20px" mb={3}>
                Click for taking reward!
              </Text>
              <Button
                onClick={unStaking}
                mb={10}
                isLoading={loading ? 1 : null}
                loadingText="Unstaking.."
              >
                Unstaking
              </Button>
            </Flex>
          ) : (
            <Button
              backgroundColor={"var(--chakra-colors-gray-200)"}
              minW="150px"
              minH="150px"
              borderRadius={"50%"}
              onClick={onOpen}
              bgColor="gray.400"
              mb={7}
              fontSize="70px"
            >
              +
            </Button>
          )}
          {/* <Separator m={"20px 0"} /> */}
          {mainNftData ? (
            <Flex
              p={"10px"}
              w="100%"
              bgColor={"whiteAlpha.100"}
              borderRadius={"15px"}
              color={"gray.400"}
              fontWeight="bold"
              justifyContent={"space-around"}
            >
              <Flex flexDirection={"column"}>
                <Box mb={"16px"}>GRADE</Box>
                <Box color={"teal.400"} fontSize={"xl"}>
                  {grade}
                </Box>
              </Flex>
              <Flex flexDirection={"column"}>
                <Box mb={"16px"}>Staking Start Time</Box>
                <Box color={"teal.400"} fontSize={"xl"}>
                  {startTime}
                </Box>
              </Flex>
              <Flex flexDirection={"column"}>
                <Box mb={"16px"}>Staking End Time</Box>
                <Box color={"teal.400"} fontSize={"xl"}>
                  {endTime}
                </Box>
              </Flex>
              <Flex flexDirection={"column"}>
                <Box mb={"16px"}>Expected Reward</Box>
                <Box color={"teal.400"} fontSize={"xl"}>
                  {reward}
                </Box>
              </Flex>
            </Flex>
          ) : (
            <BlankComponent receivedText={[`대표 NFT를 지정해 주세요!`]} />
          )}
        </Flex>
        <Separator />
        {stakingEvents.length != 0 && (
          <Box m={"20px 0"}>
            <Text fontSize={"1.5rem"} color={"gray.400"} fontWeight="bold">
              Rewarded History
            </Text>
            <RewardHistory
              stakingEvents={stakingEvents}
              dateConverter={dateConverter}
            />
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default Staking;
