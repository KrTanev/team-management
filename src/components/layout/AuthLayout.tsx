import { Box, Typography } from "@mui/material"
import { Outlet } from "react-router-dom"

export const AuthLayout = () => {
    return <Box>
        <Typography>
        </Typography>
        <Outlet/>
    </Box>
}