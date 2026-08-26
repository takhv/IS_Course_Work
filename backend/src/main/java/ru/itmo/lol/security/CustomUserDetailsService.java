package ru.itmo.lol.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import ru.itmo.lol.entity.Player;
import ru.itmo.lol.repository.PlayerRepository;


@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private PlayerRepository playerRepository;

    @Override
    public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {
        Player player = playerRepository.findByLogin(login)
                .orElseThrow(() -> new UsernameNotFoundException("player not found with login: " + login));

        return User.builder()
                .username(player.getLogin())
                .password(player.getPasswordHash())
                .roles("USER")
                .build();
    }
}
